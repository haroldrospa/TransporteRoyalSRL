import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Conduce } from '@/types/conduces';
import {
  fetchBasicEntregasStats,
  fetchPendingConducesOnly,
  fetchWarehouseConducesForTruck,
  fetchTodayCompletedConduces,
  fetchTodayReturnedConduces,
  preloadMoreConduces,
  clearUltraCache
} from '@/services/conduces/ultraFastFetchConduces';
import { calculateTransitTime } from '@/utils/time/transitTime';
import { initializeUltraFastMode } from '@/services/conduces/cacheManager';
import { supabase } from '@/integrations/supabase/client';
import { getTruckWarehouse, getRegionByTruck } from '@/utils/trucksByRegion';
import { toast } from '@/hooks/use-toast';

interface UltraFastEntregasData {
  // Core data
  pendingDeliveries: Conduce[];
  warehouseDeliveries: Conduce[];
  completedDeliveries: Conduce[];
  returnedDeliveries: Conduce[];
  userConduces: Conduce[];
  
  // Loading states
  loading: boolean;
  loadingWarehouse: boolean;
  loadingCompleted: boolean;
  loadingReturned: boolean;
  
  // Stats
  stats: {
    totalConduces: number;
    totalBultos: number;
    totalClientes: number;
  };
  
  // User info
  regionActual: string;
  hasCamion: boolean;
  isAdmin: boolean;
  userCamion?: string;
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Actions
  handleRefreshData: () => Promise<void>;
  loadMorePending: () => Promise<void>;
  handleUpdateConduceRoute: (conduceId: string, newRoute: string) => Promise<boolean>;
  handleMoveToTruck: (conduceId: string) => Promise<boolean>;
  handleMoveToWarehouse: (conduceId: string) => Promise<boolean>;
}

export const useUltraFastEntregasData = (): UltraFastEntregasData => {
  const { user } = useAuth();
  const { regionActual, loadClientesByNumeros } = useData();
  
  // Initialize ultra-fast mode on first render
  useEffect(() => {
    initializeUltraFastMode();
  }, []);
  
  console.log('🚀 UltraFast Hook Initialized');
  console.log(`👤 User: ${user?.nombre}, Level: ${user?.nivel}, Camion: ${user?.camion}`);
  console.log(`🌍 Region: ${regionActual}`);
  
  // Core state
  const [pendingDeliveries, setPendingDeliveries] = useState<Conduce[]>([]);
  const [warehouseDeliveries, setWarehouseDeliveries] = useState<Conduce[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Conduce[]>([]);
  const [returnedDeliveries, setReturnedDeliveries] = useState<Conduce[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingWarehouse, setLoadingWarehouse] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [loadingReturned, setLoadingReturned] = useState(true);
  
  // Stats state
  const [stats, setStats] = useState({
    totalConduces: 0,
    totalBultos: 0,
    totalClientes: 0
  });

  // Memoized user info
  const { isAdmin, userCamion, hasCamion } = useMemo(() => {
    const isAdmin = user?.nivel >= 4;
    const userCamion = user?.camion;
    const hasCamion = !!userCamion || isAdmin;
    
    console.log(`🚀 UltraFast: hasCamion=${hasCamion}, isAdmin=${isAdmin}, userCamion=${userCamion}`);
    
    return { isAdmin, userCamion, hasCamion };
  }, [user]);

  // Memoized user conduces (including warehouse)
  const userConduces = useMemo(() => {
    return [...pendingDeliveries, ...warehouseDeliveries, ...completedDeliveries, ...returnedDeliveries];
  }, [pendingDeliveries, warehouseDeliveries, completedDeliveries, returnedDeliveries]);

  // Ultra fast initial load - pendientes, almacén y stats
  const loadCriticalData = useCallback(async () => {
    if (!regionActual) return;
    
    console.log('🚀 UltraFast: Loading critical data...');
    console.log(`🌍 Region: ${regionActual}, User: ${user?.nombre}, Camion: ${userCamion}, Admin: ${isAdmin}`);
    
    setLoading(true);
    setLoadingWarehouse(true);
    
    try {
      // Cargar en paralelo: stats básicas, conduces pendientes y conduces en almacén
      console.log('📊 Fetching basic stats, pending conduces, and warehouse conduces...');
      const [basicStats, pendingConduces, warehouseConduces] = await Promise.all([
        fetchBasicEntregasStats(regionActual, isAdmin ? undefined : userCamion),
        fetchPendingConducesOnly(regionActual, isAdmin ? undefined : userCamion),
        fetchWarehouseConducesForTruck(isAdmin ? undefined : userCamion, regionActual)
      ]);

      console.log('✅ UltraFast: Critical data loaded');
      console.log('📊 Basic stats received:', basicStats);
      console.log('📦 Pending conduces received:', pendingConduces.length);
      console.log('🏭 Warehouse conduces received:', warehouseConduces.length);

      // Actualizar stats inmediatamente
      setStats(basicStats);
      
      // Actualizar pendientes con sorting optimizado
      const sortedPending = pendingConduces.sort((a, b) => {
        if (a.prioridad && !b.prioridad) return -1;
        if (!a.prioridad && b.prioridad) return 1;
        const timeA = calculateTransitTime(a.fechaEntrega).totalHours;
        const timeB = calculateTransitTime(b.fechaEntrega).totalHours;
        return timeB - timeA;
      });

      // Ordenar almacén
      const sortedWarehouse = warehouseConduces.sort((a, b) => {
        if (a.prioridad && !b.prioridad) return -1;
        if (!a.prioridad && b.prioridad) return 1;
        return a.numeroConduce.localeCompare(b.numeroConduce);
      });
      
      setPendingDeliveries(sortedPending);
      setWarehouseDeliveries(sortedWarehouse);
      setLoading(false);
      setLoadingWarehouse(false);

      console.log('🎯 UltraFast: Critical data set, loading secondary data...');

      // Preload data in background
      setTimeout(() => {
        loadSecondaryData();
      }, 100);

    } catch (error) {
      console.error('❌ UltraFast: Error loading critical data:', error);
      setLoading(false);
      setLoadingWarehouse(false);
    }
  }, [regionActual, isAdmin, userCamion, user]);

  // Load secondary data in background
  const loadSecondaryData = useCallback(async () => {
    setCompletedDeliveries([]);
    setReturnedDeliveries([]);
    setLoadingCompleted(false);
    setLoadingReturned(false);
  }, []);

  // Actualizar ruta de un conduce (en camión o en almacén)
  const handleUpdateConduceRoute = useCallback(async (conduceId: string, newRoute: string): Promise<boolean> => {
    try {
      const targetConduce = pendingDeliveries.find(c => c.id === conduceId) || warehouseDeliveries.find(c => c.id === conduceId);
      
      if (targetConduce?.numeroCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({ ruta: newRoute })
          .eq('numero_cliente', targetConduce.numeroCliente);

        if (error) {
          console.warn('Could not update cliente route in database:', error);
        }
      }

      clearUltraCache();

      // Actualizar estado local inmediato
      setPendingDeliveries(prev => prev.map(c => 
        (c.id === conduceId || (targetConduce?.numeroCliente && c.numeroCliente === targetConduce.numeroCliente)) 
          ? { ...c, ruta: newRoute } 
          : c
      ));
      setWarehouseDeliveries(prev => prev.map(c => 
        (c.id === conduceId || (targetConduce?.numeroCliente && c.numeroCliente === targetConduce.numeroCliente)) 
          ? { ...c, ruta: newRoute } 
          : c
      ));

      toast({
        title: "Ruta actualizada",
        description: `Asignado a ${newRoute ? `Ruta ${newRoute}` : 'Ruta 0'}.`
      });
      return true;
    } catch (err) {
      console.error('Error updating conduce route:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la ruta.",
        variant: "destructive"
      });
      return false;
    }
  }, [pendingDeliveries, warehouseDeliveries]);

  // Mover de almacén al camión del chofer
  const handleMoveToTruck = useCallback(async (conduceId: string): Promise<boolean> => {
    const targetTruck = userCamion || 'R-01';

    try {
      const targetRegion = getRegionByTruck(targetTruck);
      const payload: any = { encomendado: targetTruck };
      if (targetRegion) payload.region = targetRegion;

      const { error } = await supabase
        .from('conduces')
        .update(payload)
        .eq('id', conduceId);

      if (error) throw error;

      clearUltraCache();

      // Mover de warehouseDeliveries a pendingDeliveries
      const movedItem = warehouseDeliveries.find(c => c.id === conduceId);
      if (movedItem) {
        const updated = { ...movedItem, encomendado: targetTruck, region: targetRegion || movedItem.region };
        setWarehouseDeliveries(prev => prev.filter(c => c.id !== conduceId));
        setPendingDeliveries(prev => [updated, ...prev]);
        setStats(prev => ({
          ...prev,
          totalConduces: prev.totalConduces + 1,
          totalBultos: prev.totalBultos + (updated.cantidadBultos || 0)
        }));
      }

      toast({
        title: "Cargado al camión",
        description: `El conduce se asignó a ${targetTruck} para entregar hoy.`
      });
      return true;
    } catch (err) {
      console.error('Error moving to truck:', err);
      toast({
        title: "Error",
        description: "No se pudo mover el conduce al camión.",
        variant: "destructive"
      });
      return false;
    }
  }, [userCamion, warehouseDeliveries]);

  // Mover del camión al almacén del chofer
  const handleMoveToWarehouse = useCallback(async (conduceId: string): Promise<boolean> => {
    const truckForWarehouse = userCamion || 'R-01';
    const targetWarehouse = getTruckWarehouse(truckForWarehouse);

    try {
      const targetRegion = getRegionByTruck(truckForWarehouse);
      const payload: any = { encomendado: targetWarehouse };
      if (targetRegion) payload.region = targetRegion;

      const { error } = await supabase
        .from('conduces')
        .update(payload)
        .eq('id', conduceId);

      if (error) throw error;

      clearUltraCache();

      // Mover de pendingDeliveries a warehouseDeliveries
      const movedItem = pendingDeliveries.find(c => c.id === conduceId);
      if (movedItem) {
        const updated = { ...movedItem, encomendado: targetWarehouse, region: targetRegion || movedItem.region };
        setPendingDeliveries(prev => prev.filter(c => c.id !== conduceId));
        setWarehouseDeliveries(prev => [updated, ...prev]);
        setStats(prev => ({
          ...prev,
          totalConduces: Math.max(0, prev.totalConduces - 1),
          totalBultos: Math.max(0, prev.totalBultos - (updated.cantidadBultos || 0))
        }));
      }

      toast({
        title: "Movido a almacén",
        description: `El conduce se dejó en ${targetWarehouse}.`
      });
      return true;
    } catch (err) {
      console.error('Error moving to warehouse:', err);
      toast({
        title: "Error",
        description: "No se pudo mover el conduce a almacén.",
        variant: "destructive"
      });
      return false;
    }
  }, [userCamion, pendingDeliveries]);

  // Load more pending conduces
  const loadMorePending = useCallback(async () => {
    if (!regionActual) return;

    try {
      const currentCount = pendingDeliveries.length;
      const morePending = await preloadMoreConduces(
        regionActual, 
        isAdmin ? undefined : userCamion, 
        currentCount, 
        20
      );

      if (morePending.length > 0) {
        setPendingDeliveries(prev => [...prev, ...morePending]);
      }
    } catch (error) {
      console.error('Error loading more pending:', error);
    }
  }, [regionActual, isAdmin, userCamion, pendingDeliveries.length]);

  // Refresh all data
  const handleRefreshData = useCallback(async () => {
    console.log('🔄 UltraFast: Refreshing all data...');
    clearUltraCache();
    setLoading(true);
    setLoadingWarehouse(true);
    setLoadingCompleted(true);
    setLoadingReturned(true);
    
    // Reset data
    setPendingDeliveries([]);
    setWarehouseDeliveries([]);
    setCompletedDeliveries([]);
    setReturnedDeliveries([]);
    setStats({ totalConduces: 0, totalBultos: 0, totalClientes: 0 });
    
    // Reload critical data first
    await loadCriticalData();
  }, [loadCriticalData]);

  // Initial load
  useEffect(() => {
    console.log('🔄 UltraFast: useEffect triggered');
    console.log(`🔄 Region: ${regionActual}, hasCamion: ${hasCamion}, user: ${user?.nombre}`);
    
    if (regionActual && hasCamion) {
      console.log('✅ UltraFast: Conditions met, starting loadCriticalData');
      loadCriticalData();
    } else {
      console.log('❌ UltraFast: Conditions not met, not loading data');
      console.log(`- regionActual: ${regionActual}`);
      console.log(`- hasCamion: ${hasCamion}`);
    }
  }, [regionActual, hasCamion, loadCriticalData]);

  // Cargar clientes bajo demanda para todos los conduces del chofer
  useEffect(() => {
    if (userConduces.length > 0 && loadClientesByNumeros) {
      const uniqueClientIds = Array.from(
        new Set(userConduces.map(c => c.numeroCliente).filter(Boolean))
      );
      loadClientesByNumeros(uniqueClientIds);
    }
  }, [userConduces, loadClientesByNumeros]);

  return {
    // Core data
    pendingDeliveries,
    warehouseDeliveries,
    completedDeliveries,
    returnedDeliveries,
    userConduces,
    
    // Loading states
    loading,
    loadingWarehouse,
    loadingCompleted,
    loadingReturned,
    
    // Stats
    stats,
    
    // User info
    regionActual,
    hasCamion,
    isAdmin,
    userCamion,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Actions
    handleRefreshData,
    loadMorePending,
    handleUpdateConduceRoute,
    handleMoveToTruck,
    handleMoveToWarehouse
  };
};