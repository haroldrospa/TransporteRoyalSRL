import { useState, useCallback, useEffect, useRef } from 'react';
import { lazyDataService, LazyDataFilters, LazyDataResponse } from '@/services/lazy/lazyDataService';
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { useToast } from '@/hooks/use-toast';

export interface UseLazyDataManagerOptions {
  initialLoad?: boolean;
  pageSize?: number;
  enableInfiniteScroll?: boolean;
}

export interface LazyDataState<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  totalCount: number;
  currentPage: number;
  filters: LazyDataFilters;
}

export const useLazyDataManager = <T extends Conduce | Cliente>(
  dataType: 'conduces' | 'clientes',
  options: UseLazyDataManagerOptions = {}
) => {
  const { initialLoad = false, pageSize = 20, enableInfiniteScroll = true } = options;
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<LazyDataState<T>>({
    data: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasNextPage: true,
    totalCount: 0,
    currentPage: 0,
    filters: {}
  });

  /**
   * Fetch data with filters and pagination
   */
  const fetchData = useCallback(async (
    page = 0,
    filters: LazyDataFilters = {},
    append = false
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: page === 0 && !append,
      loadingMore: page > 0 || append,
      error: null
    }));

    try {
      let response: LazyDataResponse<T>;

      if (dataType === 'conduces') {
        response = await lazyDataService.fetchConduces(page, pageSize, filters) as LazyDataResponse<T>;
      } else {
        response = await lazyDataService.fetchClientes(page, pageSize, filters.search) as LazyDataResponse<T>;
      }

      setState(prev => ({
        ...prev,
        data: append ? [...prev.data, ...response.data] : response.data,
        loading: false,
        loadingMore: false,
        hasNextPage: response.hasNextPage,
        totalCount: response.totalCount,
        currentPage: page,
        filters
      }));

      if (!response.fromCache) {
        console.log(`📊 Loaded ${response.data.length} ${dataType} (${response.totalCount} total)`);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Request aborted');
        return;
      }

      console.error(`❌ Error loading ${dataType}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: error.message || `Error loading ${dataType}`
      }));

      toast({
        title: "Error",
        description: `No se pudieron cargar los ${dataType}`,
        variant: "destructive"
      });
    }
  }, [dataType, pageSize, toast]);

  /**
   * Load more data (for infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasNextPage) return;

    const nextPage = state.currentPage + 1;
    await fetchData(nextPage, state.filters, true);
  }, [fetchData, state.currentPage, state.filters, state.hasNextPage, state.loadingMore]);

  /**
   * Apply filters (resets pagination)
   */
  const applyFilters = useCallback(async (filters: LazyDataFilters) => {
    console.log(`🔍 Applying filters to ${dataType}:`, filters);
    await fetchData(0, filters, false);
  }, [fetchData, dataType]);

  /**
   * Search functionality
   */
  const search = useCallback(async (searchTerm: string) => {
    const filters = { ...state.filters, search: searchTerm };
    await applyFilters(filters);
  }, [applyFilters, state.filters]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async (clearCache = false) => {
    if (clearCache) {
      lazyDataService.invalidateCache(dataType);
    }
    await fetchData(0, state.filters, false);
  }, [fetchData, dataType, state.filters]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasNextPage: true,
      totalCount: 0,
      currentPage: 0,
      filters: {}
    });
  }, []);

  /**
   * Get specific item by ID
   */
  const getItemById = useCallback((id: string) => {
    return state.data.find(item => item.id === id) || null;
  }, [state.data]);

  /**
   * Update item in local state
   */
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  }, []);

  /**
   * Remove item from local state
   */
  const removeItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id),
      totalCount: prev.totalCount - 1
    }));
  }, []);

  /**
   * Add item to local state
   */
  const addItem = useCallback((item: T) => {
    setState(prev => ({
      ...prev,
      data: [item, ...prev.data],
      totalCount: prev.totalCount + 1
    }));
  }, []);

  // Load initial data if requested
  useEffect(() => {
    if (initialLoad) {
      fetchData(0, {}, false);
    }
  }, [initialLoad, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    data: state.data,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasNextPage: state.hasNextPage,
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    filters: state.filters,

    // Actions
    fetchData,
    loadMore,
    applyFilters,
    search,
    refresh,
    reset,

    // Item operations
    getItemById,
    updateItem,
    removeItem,
    addItem,

    // Utility
    isEmpty: state.data.length === 0 && !state.loading,
    isInitialized: state.data.length > 0 || state.loading || state.error !== null
  };
};