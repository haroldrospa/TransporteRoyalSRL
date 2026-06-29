
import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseDeliveryTime } from '@/utils/lamUtils';
import { Conduce } from '@/types/conduces';
import { useLAMDates } from './lam/useLAMDates';
import { useLAMTable } from './lam/useLAMTable';
import { useLAMStats } from './lam/useLAMStats';
import { useLAMConduceOperations } from './lam/useLAMConduceOperations';
import { useProgressiveConducesData } from './useProgressiveConducesData';
import { useTotalBultosEntregados } from './useTotalBultosEntregados';

export const useTaapharmaceuticaContent = () => {
  const { regionActual, setRegionActual } = useData();
  const { user } = useAuth();
  
  const { totalBultosEntregados, loading: loadingTotalBultos } = useTotalBultosEntregados();
  
  const { 
    conduces: optimizedConduces, 
    loading: optimizedLoading, 
    loadConduceImage,
    updateConduce: updateOptimizedConduce,
    refresh: refreshOptimized
  } = useProgressiveConducesData({ laboratorio: 'Taapharmaceutica' });

  const userHasLabAccess = useMemo(() => {
    if (!user) return false;
    if (user.nivel >= 4 || !user.laboratorio) return true;
    if (user.nivel === 6) return true;
    return user.laboratorio === 'Taapharmaceutica';
  }, [user]);
  
  const safeConduces = useMemo(() => {
    if (!Array.isArray(optimizedConduces)) return [];
    if (!userHasLabAccess) return [];
    return optimizedConduces.filter(c => c?.laboratorio === 'Taapharmaceutica');
  }, [optimizedConduces, userHasLabAccess]);
  
  const regionConduces = useMemo(() => {
    if (!Array.isArray(safeConduces) || !regionActual) return [];
    return safeConduces.filter(c => c?.region === regionActual);
  }, [safeConduces, regionActual]);
  
  const {
    dateRange, setDateRange,
    selectedDate, setSelectedDate,
    selectedMonth, setSelectedMonth,
    uniqueDates, latestLoadDate,
    navigateDate, filterConducesByDateRange
  } = useLAMDates(regionConduces);
  
  const statsFilteredConduces = useMemo(() => {
    if (!Array.isArray(regionConduces)) return [];
    return filterConducesByDateRange(regionConduces);
  }, [regionConduces, filterConducesByDateRange]);
  
  const { stats, chartInfo, bultosMonthlyData } = useLAMStats(
    statsFilteredConduces, selectedMonth, parseDeliveryTime, regionConduces, totalBultosEntregados
  );
  
  const {
    tableSearchTerm, setTableSearchTerm,
    selectedConduce, setSelectedConduce,
    showDetailsDialog, setShowDetailsDialog,
    sortedConduces, handleConduceClick,
    estadoFilter, setEstadoFilter
  } = useLAMTable(regionConduces, statsFilteredConduces, selectedDate, selectedMonth, parseDeliveryTime, safeConduces);
  
  const { handleSaveConduceChanges, handleRefresh, handleRegionChange } = useLAMConduceOperations();

  const handleSaveChanges = useCallback(async (updates: Partial<Conduce>) => {
    if (!selectedConduce) return;
    setSelectedConduce(prev => prev ? { ...prev, ...updates } : null);
    const success = await handleSaveConduceChanges(selectedConduce, updates);
    if (success) {
      await refreshOptimized();
      setShowDetailsDialog(false);
    } else {
      setSelectedConduce(selectedConduce);
    }
  }, [handleSaveConduceChanges, selectedConduce, setSelectedConduce, setShowDetailsDialog, refreshOptimized]);

  const memoizedRefresh = useCallback(async () => {
    await refreshOptimized();
  }, [refreshOptimized]);

  const handleStateFilter = useCallback((estado: string) => {
    setEstadoFilter(estado === estadoFilter ? '' : estado);
  }, [estadoFilter, setEstadoFilter]);

  return {
    loading: optimizedLoading || loadingTotalBultos,
    regionActual, handleRegionChange,
    dateRange, setDateRange,
    tableSearchTerm, setTableSearchTerm,
    selectedDate, setSelectedDate,
    selectedMonth, setSelectedMonth,
    selectedConduce, showDetailsDialog, setShowDetailsDialog,
    stats, chartInfo, bultosMonthlyData,
    uniqueDates, latestLoadDate,
    sortedConduces, statsFilteredConduces, regionConduces,
    handleSaveConduceChanges: handleSaveChanges,
    handleConduceClick,
    handleRefresh: memoizedRefresh,
    navigateDate,
    hasNoData: !Array.isArray(safeConduces) || safeConduces.length === 0,
    loadConduceImage,
    estadoFilter, handleStateFilter
  };
};
