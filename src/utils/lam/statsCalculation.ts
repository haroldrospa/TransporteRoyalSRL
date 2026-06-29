
import { Conduce, EstadoBulto } from '@/types/conduces';
import { isValid } from 'date-fns';
import { filterConducesByMonth } from './dateFilters';

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
      clientesEnTransito: 0,
      totalBultosEntregadosDB: 0 // Nuevo campo para total de DB
    };
  }
  
  // Use the conduces as they come - they should already be filtered by date range
  const filteredConduces = conduces;

  try {
    // Log data for debugging
    const entregadosConduces = filteredConduces.filter(c => c && c.estado === 'Entregado');
    console.log('LAM Stats Debug:', {
      totalConduces: filteredConduces.length,
      entregadosConduces: entregadosConduces.length,
      firstFewEntregados: entregadosConduces.slice(0, 5).map(c => ({
        numeroConduce: c.numeroConduce,
        estado: c.estado,
        cantidadBultos: c.cantidadBultos
      }))
    });
    
    const bultosTotalCount = filteredConduces.reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
    const bultosEntregados = countBultosByEstado(filteredConduces, 'Entregado');
    const bultosDevueltos = countBultosByEstado(filteredConduces, 'Devuelto');
    const bultosEnTransito = countBultosByEstado(filteredConduces, 'En tránsito');
    
    console.log('LAM Stats Calculation:', {
      bultosTotalCount,
      bultosEntregados,
      bultosDevueltos,
      bultosEnTransito,
      totalConducesProcessed: filteredConduces.length
    });
    
    const clientesEnTransitoSet = new Set(
      filteredConduces
        .filter(c => c?.estado === 'En tránsito')
        .map(c => c?.numeroCliente || c?.razonSocial)
        .filter(Boolean)
    );
    
    const clientesEnTransito = clientesEnTransitoSet.size;

    // Use the total from DB if provided, otherwise calculate from filtered data
    const finalTotalBultosEntregadosDB = totalBultosEntregadosDB || 
      (allConduces ? countBultosByEstado(allConduces, 'Entregado') : bultosEntregados);

    // Calculate delayed packages (older than 3 days and still in transit)
    const currentDate = new Date();
    const bultosAtrasados = filteredConduces
      .filter(conduce => {
        if (conduce.estado !== 'En tránsito') return false;
        if (conduce.excepcion) return false; // Excluir bultos marcados como excepción
        
        const fechaCarga = new Date(conduce.fechaCarga);
        const daysDiff = Math.floor((currentDate.getTime() - fechaCarga.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysDiff > 3; // Packages older than 3 days
      })
      .reduce((total, conduce) => total + conduce.cantidadBultos, 0);

    return {
      bultosTotalCount,
      bultosEntregados,
      bultosDevueltos,
      bultosEnTransito,
      bultosAtrasados,
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
      clientesEnTransito: 0,
      totalBultosEntregadosDB: 0
    };
  }
};
