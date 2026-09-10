
import { Conduce, EstadoBulto } from '@/types/conduces';
import { isValid } from 'date-fns';
import { filterConducesByMonth } from './dateFilters';
import { safelyParseDate } from '../timeUtils';
import { isConduceDelayed } from '@/utils/time/conduceDelay';

/**
 * Helper function to count bultos by estado
 */
export const countBultosByEstado = (conduces: Conduce[], estado: EstadoBulto): number => {
  try {
    if (!Array.isArray(conduces)) return 0;
    return conduces
      .filter(c => c && c.estado === estado)
      .reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
  } catch (error) {
    console.error('Error counting bultos by estado:', error);
    return 0;
  }
};

/**
 * Calculate main LAM statistics
 */
export const calculateLamStats = (conduces: Conduce[], selectedMonth?: Date, allConduces?: Conduce[], totalBultosEntregadosDB?: number) => {
  // If conduces is not an array or empty, return default stats
  if (!Array.isArray(conduces) || conduces.length === 0) {
    console.log('LAM Stats: No conduces data available');
    return {
      bultosTotalCount: 0,
      bultosEntregados: 0,
      bultosDevueltos: 0,
      bultosEnTransito: 0,
      bultosAtrasados: 0,
      bultosExcepcion: 0,
      conducesExcepcionCount: 0,
      clientesEnTransito: 0,
      totalBultosEntregadosDB: 0
    };
  }
  
  // Use the conduces as they come - they should already be filtered by date range
  const filteredConduces = conduces;

  try {
    const bultosTotalCount = filteredConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const totalEntregadosBultos = countBultosByEstado(filteredConduces, 'Entregado');
    const bultosDevueltos = countBultosByEstado(filteredConduces, 'Devuelto');
    const bultosEnTransito = countBultosByEstado(filteredConduces, 'En tránsito');

    // Calculate all delayed delivered conduces
    const delayedConduces = filteredConduces.filter(c => {
      if (!c || c.estado !== 'Entregado') return false;
      return isConduceDelayed(c) || c.excepcion === true;
    });

    const bultosAtrasados = delayedConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const bultosEntregados = Math.max(0, bultosTotalCount - bultosEnTransito - bultosDevueltos - bultosAtrasados);
    
    const clientesEnTransitoSet = new Set(
      filteredConduces
        .filter(c => c?.estado === 'En tránsito')
        .map(c => c?.numeroCliente || c?.razonSocial)
        .filter(Boolean)
    );
    
    const clientesEnTransito = clientesEnTransitoSet.size;

    // Use the total from DB if provided, otherwise calculate from filtered data
    const finalTotalBultosEntregadosDB = totalBultosEntregadosDB || 
      (allConduces ? countBultosByEstado(allConduces, 'Entregado') : totalEntregadosBultos);

    const conducesConExcepcion = filteredConduces.filter(c => c?.excepcion === true);
    const bultosExcepcion = conducesConExcepcion.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const conducesExcepcionCount = conducesConExcepcion.length;

    return {
      bultosTotalCount,
      bultosEntregados,
      bultosDevueltos,
      bultosEnTransito,
      bultosAtrasados,
      bultosExcepcion,
      conducesExcepcionCount,
      clientesEnTransito,
      totalBultosEntregadosDB: finalTotalBultosEntregadosDB
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      bultosTotalCount: 0,
      bultosEntregados: 0,
      bultosDevueltos: 0,
      bultosEnTransito: 0,
      bultosAtrasados: 0,
      bultosExcepcion: 0,
      conducesExcepcionCount: 0,
      clientesEnTransito: 0,
      totalBultosEntregadosDB: 0
    };
  }
};
