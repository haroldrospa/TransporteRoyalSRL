
import { useMemo } from 'react';
import { Conduce } from '@/types/conduces';
import { calculateLamStats } from '@/utils/lam/statsCalculation';
import { calculateChartCounts } from '@/utils/lam/chartStatsCalculation';
import { getBultosPerMonth } from '@/utils/chartDataUtils';

export const useLAMStats = (
  filteredConduces: Conduce[],
  selectedMonth: Date | undefined,
  parseDeliveryTime: (time: string) => number,
  allConduces?: Conduce[], // Estos son los conduces de la región, no todos los conduces globales
  totalBultosEntregadosDB?: number
) => {
  // Calculate stats with proper error handling - conduces are already filtered by date range
  // Para el total de bultos entregados de la DB, usar solo los de la región actual
  const stats = useMemo(() => 
    calculateLamStats(filteredConduces, selectedMonth, allConduces, undefined) // No pasar totalBultosEntregadosDB global
  , [filteredConduces, selectedMonth, allConduces]);
  
  const chartInfo = useMemo(() => 
    calculateChartCounts(filteredConduces, parseDeliveryTime, selectedMonth)
  , [filteredConduces, selectedMonth, parseDeliveryTime]);
  
  // Get bultos monthly data - usar allConduces para mostrar todos los meses
  const bultosMonthlyData = useMemo(() => 
    getBultosPerMonth(allConduces || filteredConduces)
  , [allConduces, filteredConduces]);

  return {
    stats,
    chartInfo,
    bultosMonthlyData
  };
};
