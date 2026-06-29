import React, { useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cliente } from '@/types/cliente';
import { Conduce, Region } from '@/types/conduces';
import { fetchClientesOptimized, fetchConducesLazy, clearCache } from '@/services/optimizedDataService';
import { useToast } from '@/hooks/use-toast';
import { DataContext } from '../DataContext';
import { useAuth } from '../AuthContext';
import { getTrucksByRegion } from '@/utils/trucksByRegion';

// Provider optimizado que solo carga datos esenciales
export const OptimizedDataProvider = ({ children }: { children: ReactNode }) => {
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
  const [loading, setLoading] = useState(false); // Iniciar sin loading para mejor UX
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

  // Función para cargar clientes bajo demanda
  const loadClientes = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const clientesData = await fetchClientesOptimized(search, 100) as Cliente[];
      setClientes(clientesData);
      setTotalClientsCount(clientesData.length);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Función para cargar conduces bajo demanda
  const loadConduces = useCallback(async (page = 0, filters?: any) => {
    try {
      setLoading(true);
      const conducesData = await fetchConducesLazy(page, 200, filters) as any;
      if (page === 0) {
        setConduces(conducesData.data);
      } else {
        setConduces(prev => [...prev, ...conducesData.data]);
      }
      return conducesData;
    } catch (error) {
      console.error('Error loading conduces:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los conduces",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Funciones básicas requeridas por el contexto
  const addConduce = useCallback(async (conduce: Omit<Conduce, 'id'>) => {
    // Implementación básica - en una app real conectaría con el backend
    console.log('Add conduce:', conduce);
  }, []);

  const updateConduce = useCallback(async (id: string, updates: Partial<Conduce>) => {
    console.log('Update conduce:', id, updates);
  }, []);

  const addCliente = useCallback(async (cliente: Omit<Cliente, 'id'>): Promise<Cliente | null> => {
    console.log('Add cliente:', cliente);
    // Retornar un cliente mock para mantener compatibilidad
    return { ...cliente, id: 'temp-id' } as Cliente;
  }, []);

  const updateCliente = useCallback(async (id: string, updates: Partial<Cliente>) => {
    console.log('Update cliente:', id, updates);
  }, []);

  const deleteCliente = useCallback(async (id: string) => {
    console.log('Delete cliente:', id);
  }, []);

  // Funciones de filtrado optimizadas
  const getClienteByNumero = useCallback((numero: string) => {
    return clientes.find(c => c.numeroCliente === numero);
  }, [clientes]);

  const getConducesByEncomendado = useCallback((encomendado: string) => {
    return conduces.filter(c => c.encomendado === encomendado);
  }, [conduces]);

  const getConducesByEstado = useCallback((estado: string) => {
    return conduces.filter(c => c.estado === estado);
  }, [conduces]);

  const getConducesByRegion = useCallback((region: Region) => {
    return conduces.filter(c => c.region === region);
  }, [conduces]);

  // Funciones de operaciones básicas
  const asignarEncomendado = useCallback(async (conduceIds: string[], encomendado: string, prioridad?: boolean) => {
    console.log('Asignar encomendado:', conduceIds, encomendado, prioridad);
  }, []);

  const entregarConduce = useCallback(async (conduceId: string, firma: string, nota?: string, imagen?: string) => {
    console.log('Entregar conduce:', conduceId, firma, nota, imagen);
  }, []);

  const devolverConduce = useCallback(async (conduceId: string, data: any) => {
    console.log('Devolver conduce:', conduceId, data);
  }, []);

  const loadClientesByNumeros = useCallback(async (numeros: string[]) => {
    if (!numeros || numeros.length === 0) return;
    const uniqueNums = Array.from(new Set(numeros.filter(Boolean)));
    if (uniqueNums.length === 0) return;

    const existingNums = new Set(clientesRef.current.map(c => c.numeroCliente));
    const missingNums = uniqueNums.filter(num => !existingNums.has(num));
    
    if (missingNums.length === 0) return;
    
    try {
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
          return [...prev, ...newClients];
        });
      }
    } catch (err) {
      console.error('Exception in loadClientesByNumeros:', err);
    }
  }, []);

  // Función de refresh optimizada
  const refreshData = useCallback(async (force: boolean = false) => {
    if (force) {
      clearCache();
    }
    await Promise.all([
      loadClientes(),
      loadConduces(0)
    ]);
  }, [loadClientes, loadConduces]);

  const importMockData = useCallback(async () => {
    console.log('Import mock data not implemented in optimized provider');
  }, []);

  const contextValue = useMemo(() => ({
    conduces,
    clientes,
    regionActual,
    loading,
    totalClientsCount,
    setRegionActual,
    addConduce,
    updateConduce,
    addCliente,
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
    // Funciones adicionales para carga bajo demanda
    loadClientes,
    loadConduces
  }), [
    conduces,
    clientes,
    regionActual,
    loading,
    totalClientsCount,
    addConduce,
    updateConduce,
    addCliente,
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
    loadClientesByNumeros,
    loadClientes,
    loadConduces
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};