
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
    
    // Calculate all delayed conduces
    const allDelayedConduces = filteredConduces.filter(c => {
      if (!c || c.estado !== 'Entregado') return false;
      return isConduceDelayed(c);
    });
    
    // Delayed conduces without exception
    const delayedConduces = allDelayedConduces.filter(c => !c.excepcion);
    // Delayed conduces with exception
    const delayedWithExceptionConduces = allDelayedConduces.filter(c => c.excepcion);
    
    const atrasadosCount = delayedConduces.length;
    const atrasadosConExcepcionCount = delayedWithExceptionConduces.length;
    
    const conducesConExcepcion = filteredConduces.filter(c => c?.excepcion === true);
    const excepcionesCount = conducesConExcepcion.length;
    const excepcionesBultos = conducesConExcepcion.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const totalEntregados = filteredConduces.filter(c => c?.estado === 'Entregado').length;

    // Calculate bultos for each category (mutually exclusive to sum to total bultos)
    const atrasadosBultos = delayedConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const atrasadosConExcepcionBultos = delayedWithExceptionConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const devueltosBultos = countBultosByEstado(filteredConduces, 'Devuelto');
    const enTransitoBultos = countBultosByEstado(filteredConduces, 'En tránsito');
    
    const bultosTotalCount = filteredConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const totalAtrasadosBultos = atrasadosBultos + excepcionesBultos;
    const entregadosNormalBultos = Math.max(0, bultosTotalCount - enTransitoBultos - totalAtrasadosBultos);
    
    // Prepare data for pie chart containing only Entregados and Atrasados
    const chartData = [
      { name: 'Entregados', value: entregadosNormalBultos, color: '#10B981' },
      { name: 'Atrasados', value: totalAtrasadosBultos, color: '#EF4444' },
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
