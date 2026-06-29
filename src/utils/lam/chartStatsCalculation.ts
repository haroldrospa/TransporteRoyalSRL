
import { Conduce } from '@/types/conduces';
import { filterConducesByMonth } from './dateFilters';
import { countBultosByEstado } from './statsCalculation';
import { isValid } from 'date-fns';
import { isConduceDelayed } from '@/utils/time/conduceDelay';

/**
 * Calculate data for charts display
 */
export const calculateChartCounts = (conduces: Conduce[], parseDeliveryTime: (time: string) => number, selectedMonth?: Date) => {
  // If conduces is not an array or empty, return default chart data
  if (!Array.isArray(conduces) || conduces.length === 0) {
    return {
      regularClientesCount: 0,
      visitadoresClientesCount: 0,
      devueltosCount: 0,
      atrasadosCount: 0,
      atrasadosConExcepcionCount: 0,
      excepcionesCount: 0,
      totalEntregados: 0,
      chartData: []
    };
  }
  
  try {
    // Filter conduces by month if a valid month is provided
    const filteredConduces = selectedMonth && isValid(selectedMonth)
      ? filterConducesByMonth(conduces, selectedMonth)
      : conduces;

    const regularClientesCount = filteredConduces.filter(c => c?.estado === 'Entregado' && c?.numeroCliente && !c.numeroCliente.startsWith('60')).length;
    const visitadoresClientesCount = filteredConduces.filter(c => c?.estado === 'Entregado' && c?.numeroCliente && c.numeroCliente.startsWith('60')).length;
    const devueltosCount = filteredConduces.filter(c => c?.estado === 'Devuelto').length;
    
    // Calculate all delayed conduces (including those with exceptions)
    const allDelayedConduces = filteredConduces.filter(c => {
      if (!c || c.estado !== 'Entregado') return false;
      return isConduceDelayed(c);
    });
    
    // Calculate delayed conduces WITHOUT exception (for regular "Atrasados")
    const delayedConduces = allDelayedConduces.filter(c => !c.excepcion);
    
    // Calculate delayed conduces WITH exception (subset of delayed conduces)
    const delayedWithExceptionConduces = allDelayedConduces.filter(c => c.excepcion);
    
    const atrasadosCount = delayedConduces.length;
    const atrasadosConExcepcionCount = delayedWithExceptionConduces.length;
    
    const excepcionesCount = filteredConduces.filter(c => c?.excepcion).length || 0;
    const excepcionesBultos = filteredConduces
      .filter(c => c?.excepcion)
      .reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const totalEntregados = filteredConduces.filter(c => c?.estado === 'Entregado').length;

    // Calculate bultos for each category (mutually exclusive to sum to 100%)
    const atrasadosBultos = delayedConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const atrasadosConExcepcionBultos = delayedWithExceptionConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const totalDelayedBultos = atrasadosBultos + atrasadosConExcepcionBultos;
    
    // Entregados = delivered bultos MINUS delayed (sin excepción) MINUS delayed con excepción.
    const totalEntregadosBultos = countBultosByEstado(filteredConduces, 'Entregado');
    const devueltosBultos = countBultosByEstado(filteredConduces, 'Devuelto');
    const entregadosBultos = totalEntregadosBultos - atrasadosBultos + devueltosBultos;
    
    // Prepare data for pie chart
    const chartData = [
      { name: 'Entregados', value: entregadosBultos, color: '#10B981' },
      { name: 'En tránsito', value: countBultosByEstado(filteredConduces, 'En tránsito'), color: '#F59E0B' },
      { name: 'Atrasados', value: atrasadosBultos, color: '#EF4444' },
    ];

    return {
      regularClientesCount,
      visitadoresClientesCount,
      devueltosCount,
      atrasadosCount,
      atrasadosConExcepcionCount,
      excepcionesCount,
      atrasadosBultos,
      atrasadosConExcepcionBultos,
      excepcionesBultos,
      totalEntregados,
      chartData
    };
  } catch (error) {
    console.error('Error in calculateChartCounts:', error);
    return {
      regularClientesCount: 0,
      visitadoresClientesCount: 0,
      devueltosCount: 0,
      atrasadosCount: 0,
      atrasadosConExcepcionCount: 0,
      excepcionesCount: 0,
      totalEntregados: 0,
      chartData: []
    };
  }
};
