
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

export const useLAMContent = () => {
  const { regionActual, setRegionActual } = useData();
  const { user } = useAuth();
  
  // Hook para obtener el total de bultos entregados de toda la DB
  const { totalBultosEntregados, loading: loadingTotalBultos } = useTotalBultosEntregados();
  
  // Usar carga progresiva filtrada por LAM para que sea rápida
  const { 
    conduces: optimizedConduces, 
    loading: optimizedLoading, 
    loadConduceImage,
    updateConduce: updateOptimizedConduce,
    refresh: refreshOptimized,
    progress
  } = useProgressiveConducesData({ laboratorio: 'LAM' });

  // Verificar si el usuario tiene acceso a LAM
  const userHasLabAccess = useMemo(() => {
    if (!user) return false;
    // Administradores y usuarios sin laboratorio asignado ven todo
    if (user.nivel >= 4 || !user.laboratorio) return true;
    // Solo usuarios con laboratorio LAM pueden ver
    return user.laboratorio === 'LAM';
  }, [user]);
  
  // Filtrar solo conduces de LAM (laboratorio = 'LAM' o vacío/null que son los antiguos de LAM)
  const safeConduces = useMemo(() => {
    if (!Array.isArray(optimizedConduces)) return [];
    // Incluir conduces con laboratorio 'LAM' o vacío/null (datos históricos de LAM)
    return optimizedConduces.filter(c => 
      c?.laboratorio === 'LAM' || !c?.laboratorio || c?.laboratorio === ''
    );
  }, [optimizedConduces]);
  
  // Total count for display
  const totalConducesCount = safeConduces.length;
  
  // Filter conduces by region with stable reference
  const regionConduces = useMemo(() => {
    if (!Array.isArray(safeConduces) || !regionActual) return [];
    return safeConduces.filter(c => c?.region === regionActual);
  }, [safeConduces, regionActual]);
  
  // Use the date-related hook
  const {
    dateRange,
    setDateRange,
    selectedDate,
    setSelectedDate,
    selectedMonth, 
    setSelectedMonth,
    uniqueDates,
    latestLoadDate,
    navigateDate,
    filterConducesByDateRange
  } = useLAMDates(regionConduces);
  
  // Apply date range filter safely with debounced effect
  const statsFilteredConduces = useMemo(() => {
    if (!Array.isArray(regionConduces)) return [];
    const filtered = filterConducesByDateRange(regionConduces);
    return filtered;
  }, [regionConduces, filterConducesByDateRange]);
  
  // Use the stats-related hook
  const { stats, chartInfo, bultosMonthlyData } = useLAMStats(
    statsFilteredConduces,
    selectedMonth,
    parseDeliveryTime,
    regionConduces,
    totalBultosEntregados
  );
  
  // Use the table-related hook
  const {
    tableSearchTerm,
    setTableSearchTerm,
    selectedConduce,
    setSelectedConduce,
    showDetailsDialog,
    setShowDetailsDialog,
    sortedConduces,
    handleConduceClick,
    estadoFilter,
    setEstadoFilter
  } = useLAMTable(regionConduces, statsFilteredConduces, selectedDate, selectedMonth, parseDeliveryTime, safeConduces);
  
  // Use the conduce operations hook
  const { handleSaveConduceChanges, handleRefresh, handleRegionChange } = useLAMConduceOperations();

  // Memoize save changes handler
  const handleSaveChanges = useCallback(async (updates: Partial<Conduce>) => {
    if (!selectedConduce) return;
    
    // Update the local state immediately for instant UI feedback
    setSelectedConduce(prev => prev ? { ...prev, ...updates } : null);
    
    // Save changes to database
    const success = await handleSaveConduceChanges(selectedConduce, updates);
    
    if (success) {
      // Refresh data to ensure consistency
      await refreshOptimized();
      setShowDetailsDialog(false);
    } else {
      // Revert local changes if save failed
      setSelectedConduce(selectedConduce);
    }
  }, [handleSaveConduceChanges, selectedConduce, setSelectedConduce, setShowDetailsDialog, refreshOptimized]);

  // Memoize refresh handler
  const memoizedRefresh = useCallback(async () => {
    await refreshOptimized();
  }, [refreshOptimized]);

  // Handle chart state filter
  const handleStateFilter = useCallback((estado: string) => {
    setEstadoFilter(estado === estadoFilter ? '' : estado);
  }, [estadoFilter, setEstadoFilter]);

  return {
    loading: optimizedLoading || loadingTotalBultos,
    regionActual,
    handleRegionChange,
    dateRange,
    setDateRange,
    tableSearchTerm,
    setTableSearchTerm,
    selectedDate,
    setSelectedDate,
    selectedMonth, 
    setSelectedMonth,
    selectedConduce,
    showDetailsDialog,
    setShowDetailsDialog,
    stats,
    chartInfo,
    bultosMonthlyData,
    uniqueDates,
    latestLoadDate,
    sortedConduces,
    statsFilteredConduces,
    regionConduces,
    handleSaveConduceChanges: handleSaveChanges,
    handleConduceClick,
    handleRefresh: memoizedRefresh,
    navigateDate,
    hasNoData: !Array.isArray(optimizedConduces) || optimizedConduces.length === 0,
    loadConduceImage,
    estadoFilter,
    handleStateFilter,
    totalConducesCount,
    progress
  };
};
