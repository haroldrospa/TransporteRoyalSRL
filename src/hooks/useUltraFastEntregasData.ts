import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Conduce } from '@/types/conduces';
import {
  fetchBasicEntregasStats,
  fetchPendingConducesOnly,
  fetchTodayCompletedConduces,
  fetchTodayReturnedConduces,
  preloadMoreConduces,
  clearUltraCache
} from '@/services/conduces/ultraFastFetchConduces';
import { calculateTransitTime } from '@/utils/time/transitTime';
import { initializeUltraFastMode } from '@/services/conduces/cacheManager';

interface UltraFastEntregasData {
  // Core data
  pendingDeliveries: Conduce[];
  completedDeliveries: Conduce[];
  returnedDeliveries: Conduce[];
  userConduces: Conduce[];
  
  // Loading states
  loading: boolean;
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
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Actions
  handleRefreshData: () => Promise<void>;
  loadMorePending: () => Promise<void>;
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
  const [completedDeliveries, setCompletedDeliveries] = useState<Conduce[]>([]);
  const [returnedDeliveries, setReturnedDeliveries] = useState<Conduce[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(true);
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

  // Memoized user conduces
  const userConduces = useMemo(() => {
    return [...pendingDeliveries, ...completedDeliveries, ...returnedDeliveries];
  }, [pendingDeliveries, completedDeliveries, returnedDeliveries]);

  // Ultra fast initial load - solo pendientes y stats
  const loadCriticalData = useCallback(async () => {
    if (!regionActual) return;
    
    console.log('🚀 UltraFast: Loading critical data...');
    console.log(`🌍 Region: ${regionActual}, User: ${user?.nombre}, Camion: ${userCamion}, Admin: ${isAdmin}`);
    
    setLoading(true);
    
    try {
      // Cargar en paralelo: stats básicas y TODOS los conduces pendientes
      console.log('📊 Fetching basic stats and ALL pending conduces...');
      const [basicStats, pendingConduces] = await Promise.all([
        fetchBasicEntregasStats(regionActual, isAdmin ? undefined : userCamion),
        fetchPendingConducesOnly(regionActual, isAdmin ? undefined : userCamion)
      ]);

      console.log('✅ UltraFast: Critical data loaded');
      console.log('📊 Basic stats received:', basicStats);
      console.log('📦 Pending conduces received:', pendingConduces.length);

      // Actualizar stats inmediatamente
      setStats(basicStats);
      
      // Actualizar pendientes con sorting optimizado
      const sortedPending = pendingConduces.sort((a, b) => {
        // Priority first
        if (a.prioridad && !b.prioridad) return -1;
        if (!a.prioridad && b.prioridad) return 1;
        
        // Then by transit time (more hours first)
        const timeA = calculateTransitTime(a.fechaEntrega).totalHours;
        const timeB = calculateTransitTime(b.fechaEntrega).totalHours;
        return timeB - timeA;
      });
      
      setPendingDeliveries(sortedPending);
      setLoading(false);

      console.log('🎯 UltraFast: Critical data set, loading secondary data...');

      // Preload data in background (no await - fire and forget)
      setTimeout(() => {
        loadSecondaryData();
      }, 100);

    } catch (error) {
      console.error('❌ UltraFast: Error loading critical data:', error);
      setLoading(false);
    }
  }, [regionActual, isAdmin, userCamion, user]);

  // Load secondary data in background
  const loadSecondaryData = useCallback(async () => {
    // Skip loading completed and returned to prevent 500 timeouts
    setCompletedDeliveries([]);
    setReturnedDeliveries([]);
    setLoadingCompleted(false);
    setLoadingReturned(false);
  }, []);

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
    setLoadingCompleted(true);
    setLoadingReturned(true);
    
    // Reset data
    setPendingDeliveries([]);
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
    completedDeliveries,
    returnedDeliveries,
    userConduces,
    
    // Loading states
    loading,
    loadingCompleted,
    loadingReturned,
    
    // Stats
    stats,
    
    // User info
    regionActual,
    hasCamion,
    isAdmin,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Actions
    handleRefreshData,
    loadMorePending
  };
};