import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLazyDataManager } from '@/hooks/lazy/useLazyDataManager';
import { useLazyStats } from '@/hooks/lazy/useLazyStats';
import { lazyDataService, LazyDataFilters } from '@/services/lazy/lazyDataService';
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { useAuth } from './AuthContext';

interface LazyDataContextValue {
  // Conduces
  conduces: Conduce[];
  conducesLoading: boolean;
  conducesLoadingMore: boolean;
  conducesError: string | null;
  conducesHasNextPage: boolean;
  conducesTotalCount: number;
  searchConduces: (term: string) => Promise<void>;
  applyConducesFilters: (filters: LazyDataFilters) => Promise<void>;
  loadMoreConduces: () => Promise<void>;
  refreshConduces: (clearCache?: boolean) => Promise<void>;
  
  // Clientes
  clientes: Cliente[];
  clientesLoading: boolean;
  clientesLoadingMore: boolean;
  clientesError: string | null;
  clientesHasNextPage: boolean;
  clientesTotalCount: number;
  searchClientes: (term: string) => Promise<void>;
  loadMoreClientes: () => Promise<void>;
  refreshClientes: (clearCache?: boolean) => Promise<void>;
  
  // Stats
  stats: any;
  statsLoading: boolean;
  statsError: string | null;
  refreshStats: () => Promise<void>;
  
  // General
  currentRegion: string;
  setCurrentRegion: (region: string) => void;
  isInitialized: boolean;
  cacheStats: any;
  
  // Image loading
  loadConduceImage: (conduceId: string) => Promise<string | null>;
}

const LazyDataContext = createContext<LazyDataContextValue | undefined>(undefined);

export const useLazyData = () => {
  const context = useContext(LazyDataContext);
  if (!context) {
    throw new Error('useLazyData must be used within a LazyDataProvider');
  }
  return context;
};

interface LazyDataProviderProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
}

export const LazyDataProvider = ({ children, autoInitialize = false }: LazyDataProviderProps) => {
  const { user } = useAuth();
  const [currentRegion, setCurrentRegion] = useState<string>('Norte');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize region based on user's truck
  useEffect(() => {
    if (user?.camion) {
      // Logic to determine region from truck - adapt as needed
      const region = user.camion.includes('R-03') || user.camion.includes('R-04') || user.camion.includes('R-05') 
        ? 'Norte' 
        : 'Sur';
      setCurrentRegion(region);
    }
  }, [user?.camion]);

  // Conduces manager
  const conducesManager = useLazyDataManager<Conduce>('conduces', {
    initialLoad: autoInitialize,
    pageSize: 50, // Larger page size for better UX
    enableInfiniteScroll: true
  });

  // Clientes manager  
  const clientesManager = useLazyDataManager<Cliente>('clientes', {
    initialLoad: false, // Clientes are loaded on demand
    pageSize: 30,
    enableInfiniteScroll: true
  });

  // Stats with current region and date filters
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useLazyStats({
    region: currentRegion
  });

  // Apply region filter when region changes
  useEffect(() => {
    if (isInitialized && currentRegion) {
      conducesManager.applyFilters({ region: currentRegion });
    }
  }, [currentRegion, isInitialized]);

  // Load conduces image on demand
  const loadConduceImage = useCallback(async (conduceId: string) => {
    return await lazyDataService.loadConduceImage(conduceId);
  }, []);

  // Enhanced refresh functions
  const refreshConduces = useCallback(async (clearCache = false) => {
    await conducesManager.refresh(clearCache);
    if (clearCache) {
      await refreshStats();
    }
  }, [conducesManager, refreshStats]);

  const refreshClientes = useCallback(async (clearCache = false) => {
    await clientesManager.refresh(clearCache);
  }, [clientesManager]);

  // Apply filters with region
  const applyConducesFilters = useCallback(async (filters: LazyDataFilters) => {
    const filtersWithRegion = { ...filters, region: currentRegion };
    await conducesManager.applyFilters(filtersWithRegion);
  }, [conducesManager, currentRegion]);

  // Initialize data when needed
  const initializeData = useCallback(async () => {
    if (isInitialized) return;
    
    console.log('🚀 Initializing lazy data system...');
    setIsInitialized(true);
    
    // Only load initial data if autoInitialize is true
    if (autoInitialize) {
      await applyConducesFilters({});
    }
  }, [isInitialized, autoInitialize, applyConducesFilters]);

  // Get cache statistics
  const cacheStats = lazyDataService.getCacheStats();

  const contextValue: LazyDataContextValue = {
    // Conduces
    conduces: conducesManager.data,
    conducesLoading: conducesManager.loading,
    conducesLoadingMore: conducesManager.loadingMore,
    conducesError: conducesManager.error,
    conducesHasNextPage: conducesManager.hasNextPage,
    conducesTotalCount: conducesManager.totalCount,
    searchConduces: conducesManager.search,
    applyConducesFilters,
    loadMoreConduces: conducesManager.loadMore,
    refreshConduces,
    
    // Clientes
    clientes: clientesManager.data,
    clientesLoading: clientesManager.loading,
    clientesLoadingMore: clientesManager.loadingMore,
    clientesError: clientesManager.error,
    clientesHasNextPage: clientesManager.hasNextPage,
    clientesTotalCount: clientesManager.totalCount,
    searchClientes: clientesManager.search,
    loadMoreClientes: clientesManager.loadMore,
    refreshClientes,
    
    // Stats
    stats,
    statsLoading,
    statsError,
    refreshStats,
    
    // General
    currentRegion,
    setCurrentRegion,
    isInitialized,
    cacheStats,
    
    // Image loading
    loadConduceImage
  };

  // Initialize on mount if needed
  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized]);

  return (
    <LazyDataContext.Provider value={contextValue}>
      {children}
    </LazyDataContext.Provider>
  );
};