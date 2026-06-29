import { useState, useCallback, useEffect } from 'react';
import { lazyDataService, LazyDataFilters, LazyStats } from '@/services/lazy/lazyDataService';
import { useToast } from '@/hooks/use-toast';

export const useLazyStats = (filters: LazyDataFilters = {}) => {
  const [stats, setStats] = useState<LazyStats>({
    totalConduces: 0,
    enTransito: 0,
    entregados: 0,
    devueltos: 0,
    bultosEnTransito: 0,
    bultosEntregados: 0,
    clientesUnicos: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (forceRefresh) {
        lazyDataService.invalidateCache('stats');
      }

      const newStats = await lazyDataService.fetchStats(filters);
      setStats(newStats);

    } catch (error: any) {
      console.error('❌ Error loading stats:', error);
      setError(error.message || 'Error loading statistics');
      
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const refresh = useCallback(() => {
    return fetchStats(true);
  }, [fetchStats]);

  // Auto-fetch when filters change
  useEffect(() => {
    fetchStats(false);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
    fetchStats
  };
};