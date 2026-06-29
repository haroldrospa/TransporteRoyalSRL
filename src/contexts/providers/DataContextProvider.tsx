
import React, { useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { Cliente } from '@/types/cliente';
import { Conduce, Region } from '@/types/conduces';
import * as clienteService from '@/services/clienteService';
import * as conduceService from '@/services/conduceService';
import * as dataService from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { DataContext } from '../DataContext';
import { useConduceOperations } from '../hooks/useConduceOperations';
import { useClienteOperations } from '../hooks/useClienteOperations';
import { useDataFilters } from '../hooks/useDataFilters';
import { supabase } from '@/integrations/supabase/client';
import { fetchConducesOptimized } from '@/services/conduces/optimizedFetchConduces';
import { fetchClientesOptimized } from '@/services/optimizedDataService';
import { useAuth } from '../AuthContext';
import { getTrucksByRegion } from '@/utils/trucksByRegion';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conduces, setConduces] = useState<Conduce[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  const clientesRef = useRef<Cliente[]>(clientes);
  useEffect(() => {
    clientesRef.current = clientes;
  }, [clientes]);
  
  // Determinar región inicial basada en el camión del usuario
  const getInitialRegion = (): Region => {
    if (!user?.camion) return 'Norte';
    const surTrucks = getTrucksByRegion('Sur');
    return surTrucks.includes(user.camion) ? 'Sur' : 'Norte';
  };
  
  const [regionActual, setRegionActual] = useState<Region>(getInitialRegion());
  const [loading, setLoading] = useState(true); // Mantener true hasta que los datos estén listos
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [totalClientsCount, setTotalClientsCount] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Actualizar región cuando cambie el usuario
  useEffect(() => {
    if (user?.camion) {
      const newRegion = getInitialRegion();
      if (newRegion !== regionActual) {
        setRegionActual(newRegion);
      }
    }
  }, [user?.camion]);

  const { 
    addConduce, 
    updateConduce, 
    asignarEncomendado, 
    entregarConduce, 
    devolverConduce 
  } = useConduceOperations(conduces, setConduces);

  // Update the cliente operations to ensure addCliente returns the right type
  const addClienteWrapper = async (cliente: Omit<Cliente, 'id'>) => {
    try {
      const newCliente = await clienteService.addCliente(cliente);
      if (newCliente) {
        setClientes(prevClientes => [...prevClientes, newCliente]);
      }
      return newCliente;
    } catch (error) {
      console.error('Error adding cliente:', error);
      throw error;
    }
  };

  const { 
    updateCliente, 
    deleteCliente 
  } = useClienteOperations(clientes, setClientes);

  const { 
    getClienteByNumero, 
    getConducesByEncomendado, 
    getConducesByEstado, 
    getConducesByRegion 
  } = useDataFilters(conduces, clientes);

  const refreshData = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    const minTimeBetweenFetches = 1000;
    
    if (!force && now - lastFetchTime < minTimeBetweenFetches) {
      console.log('⏳ Skipping fetch, too soon since last fetch');
      return;
    }
    
    // Solo mostrar loading si es después de la carga inicial
    if (initialLoadComplete) {
      setLoading(true);
    }
    
    try {
      console.log(`🚀 [DataProvider] Starting data refresh... ${force ? '(FORCE REFRESH)' : ''}`);
      
      // Cargar datos en paralelo para máxima velocidad
      const [conducesData, clientesData] = await Promise.all([
        fetchConducesOptimized().catch(error => {
          console.error('❌ [DataProvider] Error fetching optimized conduces:', error);
          return [];
        }),
        clienteService.fetchClientes().catch(error => {
          console.error('❌ [DataProvider] Error fetching optimized clientes:', error);
          return [];
        })
      ]);
      
      console.log(`✅ [DataProvider] Loaded ${conducesData.length} conduces and ${clientesData.length} clientes`);
      
      // Auto-asignar encomendado del cliente cuando el conduce no tiene uno
      const clienteMap = new Map<string, Cliente>();
      clientesData.forEach(c => clienteMap.set(c.numeroCliente, c));
      const conducesToUpdate: { numeroConduce: string; encomendado: string }[] = [];
      
      const enrichedConduces = conducesData.map(conduce => {
        if (!conduce.encomendado && conduce.estado === 'En tránsito') {
          const cliente = clienteMap.get(conduce.numeroCliente);
          if (cliente?.encomendado) {
            conducesToUpdate.push({ numeroConduce: conduce.numeroConduce, encomendado: cliente.encomendado });
            return { ...conduce, encomendado: cliente.encomendado };
          }
        }
        return conduce;
      });
      
      // Actualizar en DB en background (no bloquear UI)
      if (conducesToUpdate.length > 0) {
        console.log(`🔄 [DataProvider] Auto-asignando encomendado a ${conducesToUpdate.length} conduces desde clientes`);
        Promise.all(
          conducesToUpdate.map(({ numeroConduce, encomendado }) =>
            supabase.from('conduces').update({ encomendado }).eq('numero_conduce', numeroConduce)
          )
        ).then(() => {
          console.log(`✅ [DataProvider] Auto-asignación completada para ${conducesToUpdate.length} conduces`);
        }).catch(err => {
          console.warn('⚠️ [DataProvider] Error en auto-asignación:', err);
        });
      }
      
      // Actualizar estados de forma sincrónica para evitar renders intermedios
      setConduces(enrichedConduces);
      setClientes(clientesData);
      
      // Obtener conteo optimizado de clientes
      try {
        const { data: countData } = await supabase.rpc('get_fast_count', { table_name: 'clientes' });
        if (countData !== null) {
          setTotalClientsCount(countData);
        }
      } catch (error) {
        console.warn('⚠️ [DataProvider] Could not fetch fast client count:', error);
      }
      
      setLastFetchTime(now);
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
      console.log(`🏁 [DataProvider] Data refresh completed`);
    } catch (error) {
      console.error('💥 [DataProvider] Fatal error during data refresh:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar los datos. Intente refrescar la página.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime, toast, loading, initialLoadComplete]);

  const importMockData = useCallback(async () => {
    setLoading(true);
    try {
      await dataService.importMockData();
      await refreshData(true);
      toast({
        title: "Datos importados",
        description: "Los datos de muestra se han importado correctamente",
      });
    } catch (error) {
      console.error('Error importing mock data:', error);
      toast({
        title: "Error",
        description: "No se pudieron importar los datos de muestra",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [refreshData, toast]);

  const loadClientesByNumeros = useCallback(async (numeros: string[]) => {
    if (!numeros || numeros.length === 0) return;
    const uniqueNums = Array.from(new Set(numeros.filter(Boolean)));
    if (uniqueNums.length === 0) return;

    const existingNums = new Set(clientesRef.current.map(c => c.numeroCliente));
    const missingNums = uniqueNums.filter(num => !existingNums.has(num));
    
    if (missingNums.length === 0) return;
    
    try {
      console.log(`🔍 [DataProvider] Cargando ${missingNums.length} clientes en demanda desde la base de datos...`);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .in('numero_cliente', missingNums);
        
      if (error) {
        console.error('Error fetching clients by numbers:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const mapped = data.map(item => ({
          id: item.id,
          numeroCliente: item.numero_cliente,
          razonSocial: item.razon_social,
          ciudad: item.ciudad,
          zona: item.zona as 'Norte' | 'Sur',
          encomendado: item.encomendado || undefined,
          ruta: item.ruta || undefined,
          contacto: item.contacto || undefined,
          ubicacion: item.ubicacion || undefined,
          grupo_cliente: item.grupo_cliente || undefined
        }));
        
        setClientes(prev => {
          const currentNums = new Set(prev.map(c => c.numeroCliente));
          const newClients = mapped.filter(c => !currentNums.has(c.numeroCliente));
          if (newClients.length === 0) return prev;
          console.log(`✅ [DataProvider] Agregados ${newClients.length} clientes a la caché global`);
          return [...prev, ...newClients];
        });
      }
    } catch (err) {
      console.error('Exception in loadClientesByNumeros:', err);
    }
  }, []);

  const contextValue = useMemo(() => {
    console.log(`🔄 [DataProvider] Creating context value with ${conduces.length} conduces and ${clientes.length} clientes`);
    
    return {
      conduces,
      clientes,
      regionActual,
      loading,
      totalClientsCount,
      setRegionActual,
      addConduce,
      updateConduce,
      addCliente: addClienteWrapper,
      updateCliente,
      deleteCliente,
      getClienteByNumero,
      getConducesByEncomendado,
      getConducesByEstado,
      getConducesByRegion,
      asignarEncomendado,
      entregarConduce,
      devolverConduce,
      refreshData,
      importMockData,
      loadClientesByNumeros
    };
  }, [
    conduces, 
    clientes, 
    regionActual, 
    loading, 
    totalClientsCount,
    addConduce, 
    updateConduce, 
    addClienteWrapper, 
    updateCliente, 
    deleteCliente,
    getClienteByNumero,
    getConducesByEncomendado,
    getConducesByEstado,
    getConducesByRegion,
    asignarEncomendado,
    entregarConduce,
    devolverConduce,
    refreshData,
    importMockData,
    loadClientesByNumeros
  ]);

  // Suscripción en tiempo real DESACTIVADA para evitar recargas masivas de 25k+ registros
  // Las páginas individuales manejan sus propias suscripciones con datos filtrados

  // Cargar datos iniciales una vez solamente, sin actualizaciones automáticas
  useEffect(() => {
    refreshData(true);
  }, []); // Removido refreshData de dependencias para evitar actualizaciones automáticas

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};
