
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

export const useFersuazContent = () => {
  const { regionActual, setRegionActual } = useData();
  const { user } = useAuth();
  
  // Hook para obtener el total de bultos entregados de toda la DB
  const { totalBultosEntregados, loading: loadingTotalBultos } = useTotalBultosEntregados();
  
  // Usar carga progresiva filtrada por Fersuaz - MUCHO MÁS RÁPIDO
  const { 
    conduces: optimizedConduces, 
    loading: optimizedLoading, 
    loadConduceImage,
    updateConduce: updateOptimizedConduce,
    refresh: refreshOptimized
  } = useProgressiveConducesData({ laboratorio: 'Fersuaz' });

  // Verificar si el usuario tiene acceso a Fersuaz
  const userHasLabAccess = useMemo(() => {
    if (!user) return false;
    // Administradores y usuarios sin laboratorio asignado ven todo
    if (user.nivel >= 4 || !user.laboratorio) return true;
    // Nivel 6 siempre puede ver todos los laboratorios
    if (user.nivel === 6) return true;
    // Solo usuarios con laboratorio Fersuaz pueden ver
    return user.laboratorio === 'Fersuaz';
  }, [user]);
  
  // Filtrar solo conduces de Fersuaz (estrictamente laboratorio = 'Fersuaz')
  const safeConduces = useMemo(() => {
    if (!Array.isArray(optimizedConduces)) return [];
    if (!userHasLabAccess) return [];
    // Solo incluir conduces con laboratorio estrictamente 'Fersuaz'
    return optimizedConduces.filter(c => c?.laboratorio === 'Fersuaz');
  }, [optimizedConduces, userHasLabAccess]);
  
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
  
  // Apply date range filter safely
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
  } = useLAMTable(regionConduces, statsFilteredConduces, selectedDate, selectedMonth, parseDeliveryTime);
  
  // Use the conduce operations hook
  const { handleSaveConduceChanges, handleRefresh, handleRegionChange } = useLAMConduceOperations();

  // Memoize save changes handler
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
    hasNoData: !Array.isArray(safeConduces) || safeConduces.length === 0,
    loadConduceImage,
    estadoFilter,
    handleStateFilter
  };
};
