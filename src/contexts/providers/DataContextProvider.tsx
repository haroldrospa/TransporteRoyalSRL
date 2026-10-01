
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
import { getTrucksByRegion, getRegionByTruck } from '@/utils/trucksByRegion';

const CONDUCES_CACHE_KEY = 'royal_conduces_optimized_cache';
const CONDUCES_CACHE_TIME_KEY = 'royal_conduces_optimized_cache_time';
const CACHE_MAX_AGE = 10 * 60 * 1000; // 10 minutos para inicio instantáneo

const getInitialCachedConduces = (): Conduce[] => {
  try {
    const raw = localStorage.getItem(CONDUCES_CACHE_KEY);
    const time = localStorage.getItem(CONDUCES_CACHE_TIME_KEY);
    if (raw && time && Date.now() - parseInt(time) < CACHE_MAX_AGE) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`⚡ [DataProvider] Inicializando con ${parsed.length} conduces en caché`);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading conduces cache:', e);
  }
  return [];
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const initialCachedConduces = useMemo(() => getInitialCachedConduces(), []);
  const [conduces, setConduces] = useState<Conduce[]>(initialCachedConduces);
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const cached = clienteService.getCachedClientes();
    return cached && cached.length > 0 ? cached : [];
  });
  
  const clientesRef = useRef<Cliente[]>(clientes);
  useEffect(() => {
    clientesRef.current = clientes;
  }, [clientes]);
  
  // Determinar región inicial basada en el camión del usuario
  const getInitialRegion = (): Region => {
    if (!user?.camion) return 'Norte';
    return getRegionByTruck(user.camion) || 'Norte';
  };
  
  const [regionActual, setRegionActual] = useState<Region>(getInitialRegion());
  const [loading, setLoading] = useState(initialCachedConduces.length === 0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(initialCachedConduces.length > 0);
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

  const isRefreshingRef = useRef(false);

  const refreshData = useCallback(async (force: boolean = false) => {
    if (isRefreshingRef.current) {
      console.log('⏳ Skipping fetch, already in progress');
      return;
    }

    const now = Date.now();
    const minTimeBetweenFetches = 1000;
    
    if (!force && now - lastFetchTime < minTimeBetweenFetches) {
      console.log('⏳ Skipping fetch, too soon since last fetch');
      return;
    }

    isRefreshingRef.current = true;
    
    // Solo mostrar loading si aún no tenemos datos en memoria
    if (conduces.length === 0) {
      setLoading(true);
    }
    
    try {
      console.log(`🚀 [DataProvider] Starting data refresh... ${force ? '(FORCE REFRESH)' : ''}`);
      
      // Cargar datos en paralelo para máxima velocidad (limitado a los 3,000 más recientes para rendimiento óptimo)
      const [conducesData, clientesData] = await Promise.all([
        fetchConducesOptimized(3000).catch(error => {
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
      const conducesToUpdate: { numeroConduce: string; encomendado: string; region?: Region }[] = [];
      
      const enrichedConduces = conducesData.map(conduce => {
        if (!conduce.encomendado && conduce.estado === 'En tránsito') {
          const cliente = clienteMap.get(conduce.numeroCliente);
          if (cliente?.encomendado) {
            const targetRegion = getRegionByTruck(cliente.encomendado);
            conducesToUpdate.push({ 
              numeroConduce: conduce.numeroConduce, 
              encomendado: cliente.encomendado,
              ...(targetRegion ? { region: targetRegion } : {})
            });
            return { 
              ...conduce, 
              encomendado: cliente.encomendado,
              ...(targetRegion ? { region: targetRegion } : {})
            };
          }
        }
        return conduce;
      });
      
      // Actualizar en DB en background (no bloquear UI)
      if (conducesToUpdate.length > 0) {
        console.log(`🔄 [DataProvider] Auto-asignando encomendado a ${conducesToUpdate.length} conduces desde clientes`);
        Promise.all(
          conducesToUpdate.map(({ numeroConduce, encomendado, region }) =>
            supabase.from('conduces').update({ 
              encomendado,
              ...(region ? { region } : {})
            }).eq('numero_conduce', numeroConduce)
          )
        ).then(() => {
          console.log(`✅ [DataProvider] Auto-asignación completada para ${conducesToUpdate.length} conduces`);
        }).catch(err => {
          console.warn('⚠️ [DataProvider] Error en auto-asignación:', err);
        });
      }
      
      // Actualizar estados de forma sincrónica para evitar renders intermedios
      setConduces(enrichedConduces);
      try {
        // Priorizar todos los conduces 'En tránsito' (activos en ruta) y hasta 150 recientes
        // para garantizar carga instantánea (0ms) sin exceder la cuota de localStorage (~5MB)
        const inTransit = enrichedConduces.filter(c => c.estado === 'En tránsito');
        const others = enrichedConduces.filter(c => c.estado !== 'En tránsito').slice(0, 150);
        const toCache = [...inTransit, ...others];
        localStorage.setItem(CONDUCES_CACHE_KEY, JSON.stringify(toCache));
        localStorage.setItem(CONDUCES_CACHE_TIME_KEY, Date.now().toString());
      } catch (cacheErr) {
        try {
          const onlyInTransit = enrichedConduces.filter(c => c.estado === 'En tránsito');
          localStorage.setItem(CONDUCES_CACHE_KEY, JSON.stringify(onlyInTransit));
          localStorage.setItem(CONDUCES_CACHE_TIME_KEY, Date.now().toString());
        } catch (innerErr) {
          console.warn('Could not cache conduces to localStorage:', innerErr);
        }
      }
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
      isRefreshingRef.current = false;
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
    const uniqueNums = Array.from(new Set(numeros.filter(Boolean).map(n => String(n).trim())));
    if (uniqueNums.length === 0) return;

    // Check which ones either don't exist OR exist but have missing encomendado/ruta
    const existingMap = new Map(clientesRef.current.map(c => [String(c.numeroCliente).trim(), c]));
    const missingNums = uniqueNums.filter(num => {
      const existing = existingMap.get(num);
      return !existing || !existing.encomendado;
    });
    
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
          const map = new Map(prev.map(c => [String(c.numeroCliente).trim(), c]));
          mapped.forEach(c => {
            map.set(String(c.numeroCliente).trim(), c);
          });
          const updated = Array.from(map.values());
          clienteService.saveClientesToCache(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Exception in loadClientesByNumeros:', err);
    }
  }, []);

  const updateClienteEncomendado = useCallback(async (numeroClientes: string[], encomendado: string | null) => {
    if (!numeroClientes || numeroClientes.length === 0) return;
    const validNumbers = numeroClientes.filter(n => n && !n.startsWith('__sin_asignar__'));
    if (validNumbers.length === 0) return;

    const cleanEnc = (encomendado || '').trim() || null;
    const numSet = new Set(validNumbers.map(n => String(n).trim()));

    console.log(`🚚 [DataProvider] Asignando predeterminado "${cleanEnc}" a ${validNumbers.length} clientes`);

    // 1. Inmediatamente actualizar estado React en memoria
    setClientes(prev => {
      const updated = prev.map(c => {
        if (numSet.has(String(c.numeroCliente).trim())) {
          return { ...c, encomendado: cleanEnc };
        }
        return c;
      });
      clienteService.saveClientesToCache(updated);
      return updated;
    });

    // 2. Inmediatamente guardar en caché de localStorage
    clienteService.updateClienteInCache(validNumbers, cleanEnc);

    // 3. Persistir en la base de datos Supabase
    const { error } = await supabase
      .from('clientes')
      .update({ encomendado: cleanEnc })
      .in('numero_cliente', validNumbers);

    if (error) {
      console.error('Error actualizando encomendado en Supabase:', error);
      throw error;
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
      loadClientesByNumeros,
      updateClienteEncomendado
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
    loadClientesByNumeros,
    updateClienteEncomendado
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
