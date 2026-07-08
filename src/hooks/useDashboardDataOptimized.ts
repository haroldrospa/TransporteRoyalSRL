import { useState, useEffect, useMemo, useCallback } from 'react';
import { Conduce, Region } from '@/types/conduces';
import { fetchConducesOptimized } from '@/services/conduces/optimizedFetchConduces';
import { isConduceDelayed } from '@/utils/time';

// Cache para evitar re-fetches
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useDashboardDataOptimized() {
  const [isLoading, setIsLoading] = useState(true);
  const [regionActual, setRegionActual] = useState<Region>('Norte');
  const [dashboardData, setDashboardData] = useState({
    conduces: [] as Conduce[],
    norteBultos: 0,
    surBultos: 0,
    esteBultos: 0,
    delayedCount: 0,
    camionesStats: [] as any[]
  });

  // Función optimizada para obtener solo datos esenciales del dashboard
  const fetchDashboardData = useCallback(async () => {
    const cacheKey = 'dashboard-data';
    
    // FORZAR limpieza del caché para asegurar datos frescos
    dataCache.delete(cacheKey);
    console.log('Dashboard: Cache cleared, fetching fresh data...');

    try {
      setIsLoading(true);
      console.log('Fetching optimized dashboard data...');
      
      const startTime = performance.now();
      
      // Usar el mismo servicio que LAM para obtener TODOS los conduces
      const conduces = await fetchConducesOptimized();
      
      console.log('Dashboard: Total conduces fetched:', conduces.length);
      
      console.log('Dashboard: Total conduces fetched:', conduces.length);
      console.log('Dashboard: States breakdown:', {
        enTransito: conduces.filter(c => c.estado === 'En tránsito').length,
        entregado: conduces.filter(c => c.estado === 'Entregado').length,
        devuelto: conduces.filter(c => c.estado === 'Devuelto').length,
        otros: conduces.filter(c => !['En tránsito', 'Entregado', 'Devuelto'].includes(c.estado)).length
      });
      
      // Calcular métricas usando EXACTAMENTE la misma lógica que LAM
      const metrics = conduces.reduce((acc, conduce) => {
        // Bultos "En tránsito" por región - EXACTAMENTE como en LAM
        if (conduce.estado === 'En tránsito') {
          if (conduce.region === 'Norte') {
            acc.norteBultos += conduce.cantidadBultos;
          } else if (conduce.region === 'Sur') {
            acc.surBultos += conduce.cantidadBultos;
          } else if (conduce.region === 'Este') {
            acc.esteBultos += conduce.cantidadBultos;
          }
        }

        // Entregas retrasadas (solo para los en tránsito)
        if (conduce.estado === 'En tránsito' && isConduceDelayed(conduce)) {
          acc.delayedCount++;
        }

        // Estadísticas de camiones (solo para los en tránsito)
        if (conduce.estado === 'En tránsito' && conduce.encomendado) {
          const truck = conduce.encomendado;
          if (!acc.truckStats[truck]) {
            acc.truckStats[truck] = { clientCount: 0, bultos: 0 };
          }
          acc.truckStats[truck].clientCount++;
          acc.truckStats[truck].bultos += conduce.cantidadBultos;
        }

        return acc;
      }, {
        norteBultos: 0,
        surBultos: 0,
        esteBultos: 0,
        delayedCount: 0,
        truckStats: {} as Record<string, { clientCount: number; bultos: number }>
      });
      
      console.log('Dashboard: Final metrics:', {
        norteBultos: metrics.norteBultos,
        surBultos: metrics.surBultos,
        esteBultos: metrics.esteBultos,
        totalBultosEnTransito: metrics.norteBultos + metrics.surBultos + metrics.esteBultos,
        delayedCount: metrics.delayedCount
      });

      // Convertir stats de camiones al formato esperado
      const camionesStats = Object.entries(metrics.truckStats).map(([truck, data]) => ({
        truck,
        clientCount: (data as any).clientCount,
        bultos: (data as any).bultos,
        conduces: (data as any).clientCount
      }));

      const result = {
        conduces,
        norteBultos: metrics.norteBultos,
        surBultos: metrics.surBultos,
        esteBultos: metrics.esteBultos,
        delayedCount: metrics.delayedCount,
        camionesStats
      };

      // Guardar en cache
      dataCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      setDashboardData(result);
      
      const endTime = performance.now();
      console.log(`Dashboard data loaded in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Conduces filtrados por región (memoizados)
  const filteredConduces = useMemo(() => {
    return dashboardData.conduces.filter(conduce => conduce.region === regionActual);
  }, [dashboardData.conduces, regionActual]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Función para refrescar datos manualmente
  const refreshData = useCallback(() => {
    dataCache.delete('dashboard-data');
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    conduces: filteredConduces,
    norteBultos: dashboardData.norteBultos,
    surBultos: dashboardData.surBultos,
    esteBultos: dashboardData.esteBultos,
    delayedCount: dashboardData.delayedCount,
    camionesStats: dashboardData.camionesStats,
    regionActual,
    setRegionActual,
    isLoading,
    refreshData
  };
}