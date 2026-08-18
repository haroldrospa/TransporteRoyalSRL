import { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseDeliveryTime } from '@/utils/lamUtils';
import { Conduce } from '@/types/conduces';
import { useLAMDates } from './lam/useLAMDates';
import { useLAMTable } from './lam/useLAMTable';
import { useLAMStats } from './lam/useLAMStats';
import { generateDemoConduces } from '@/utils/demoLabData';
import { toast } from '@/hooks/use-toast';

export const useDemoLabContent = () => {
  const { regionActual, setRegionActual } = useData();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [conduces, setConduces] = useState<Conduce[]>(() => generateDemoConduces());

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    // Simulate brief network refresh for demonstration
    await new Promise(resolve => setTimeout(resolve, 500));
    setConduces(generateDemoConduces());
    setLoading(false);
    toast({
      title: "Datos actualizados",
      description: "Panel de Laboratorio Demo actualizado correctamente."
    });
  }, []);

  const handleRegionChange = useCallback((region: any) => {
    setRegionActual(region);
  }, [setRegionActual]);

  const safeConduces = useMemo(() => {
    return Array.isArray(conduces) ? conduces : [];
  }, [conduces]);

  const totalConducesCount = safeConduces.length;

  const regionConduces = useMemo(() => {
    if (!Array.isArray(safeConduces) || !regionActual) return [];
    return safeConduces.filter(c => c?.region === regionActual);
  }, [safeConduces, regionActual]);

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

  const statsFilteredConduces = useMemo(() => {
    if (!Array.isArray(regionConduces)) return [];
    return filterConducesByDateRange(regionConduces);
  }, [regionConduces, filterConducesByDateRange]);

  const { stats, chartInfo, bultosMonthlyData } = useLAMStats(
    statsFilteredConduces,
    selectedMonth,
    parseDeliveryTime,
    regionConduces,
    undefined
  );

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

  const handleSaveConduceChanges = useCallback(async (updates: Partial<Conduce>) => {
    if (!selectedConduce) return;

    const updatedConduce = { ...selectedConduce, ...updates };
    setSelectedConduce(updatedConduce);

    setConduces(prev => prev.map(c => c.id === selectedConduce.id ? updatedConduce : c));

    toast({
      title: "Cambios guardados",
      description: "El conduce ha sido actualizado en modo demostración."
    });

    setShowDetailsDialog(false);
  }, [selectedConduce, setSelectedConduce, setShowDetailsDialog]);

  const loadConduceImage = useCallback(async (conduceId: string): Promise<string | null> => {
    const c = safeConduces.find(item => item.id === conduceId);
    return c?.firma || c?.imagen || null;
  }, [safeConduces]);

  const handleStateFilter = useCallback((estado: string) => {
    setEstadoFilter(estado === estadoFilter ? '' : estado);
  }, [estadoFilter, setEstadoFilter]);

  return {
    loading,
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
    handleSaveConduceChanges,
    handleConduceClick,
    handleRefresh,
    navigateDate,
    hasNoData: safeConduces.length === 0,
    loadConduceImage,
    estadoFilter,
    handleStateFilter,
    totalConducesCount
  };
};
