import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isConduceDelayed } from '@/utils/time/conduceDelay';
import { isVisitador } from '@/components/clientes/utils/clienteTypeUtils';
import { calculateDeliveryTime, isDeliveryDelayed } from '@/utils/time/deliveryTime';
import { Region } from '@/types/conduces';
import { useAuth } from '@/contexts/AuthContext';
import { getTrucksByRegion } from '@/utils/trucksByRegion';

interface DelayedConduce {
  numeroConduce: string;
  razonSocial: string;
  cantidadBultos: number;
  diasAtraso: number;
  encomendado: string | null;
  estado: string;
}

interface RecentDelivery {
  id: string;
  numeroConduce: string;
  razonSocial: string;
  cantidadBultos: number;
  horaEntrega: string;
}

interface DashboardStats {
  norteBultos: number;
  surBultos: number;
  delayedCount: number;
  delayedConduces: DelayedConduce[];
  recentDeliveries: RecentDelivery[];
  camionesStats: Array<{
    truck: string;
    clientCount: number;
    bultos: number;
    conduces: number;
  }>;
}

interface RegionStats {
  region_bultos_en_transito: number;
  region_conduces_en_transito: number;
  region_clientes_en_transito: number;
  region_bultos_entregados: number;
  region_conduces_entregados: number;
  region_bultos_devueltos: number;
  region_conduces_devueltos: number;
}

// Cache ultra-rápido en memoria
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minuto

export function useFastDashboardData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    norteBultos: 0,
    surBultos: 0,
    delayedCount: 0,
    delayedConduces: [],
    recentDeliveries: [],
    camionesStats: []
  });
  
  // Determinar región inicial basada en el camión del usuario
  const getInitialRegion = (): Region => {
    if (!user?.camion) return 'Norte';
    const surTrucks = getTrucksByRegion('Sur');
    return surTrucks.includes(user.camion) ? 'Sur' : 'Norte';
  };
  
  const [regionActual, setRegionActual] = useState<Region>(getInitialRegion());
  const hasFetchedRef = useRef(false);

  // Función ultra-rápida usando RPCs
  const fetchStats = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'dashboard-fast-stats';
    
    // Check cache first
    if (!forceRefresh) {
      const cached = statsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('⚡ Dashboard: Using cached stats');
        setStats(cached.data);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // Get current month info for filtering
      const now = new Date();
      
      // Build month pattern for LIKE filter (fecha_carga is DD/MM/YYYY)
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      const yearStr = String(now.getFullYear());
      const monthPattern = `%/${monthStr}/${yearStr}%`;

      // Hacer llamadas paralelas
      const [norteResult, surResult, truckStatsResult, delayedResult, enTransitoResult, recentResult] = await Promise.all([
        supabase.rpc('get_region_bultos_stats', { region_name: 'Norte' }),
        supabase.rpc('get_region_bultos_stats', { region_name: 'Sur' }),
        supabase
          .from('conduces')
          .select('encomendado, cantidad_bultos')
          .eq('estado', 'En tránsito')
          .not('encomendado', 'is', null),
        supabase
          .from('conduces')
          .select('numero_conduce, razon_social, cantidad_bultos, fecha_carga, encomendado, tiempo_entrega, numero_cliente, estado')
          .eq('estado', 'Entregado')
          .like('fecha_carga', monthPattern)
          .not('tiempo_entrega', 'is', null)
          .or('excepcion.is.null,excepcion.eq.false'),
        supabase
          .from('conduces')
          .select('numero_conduce, razon_social, cantidad_bultos, fecha_carga, fecha_entrega, encomendado, numero_cliente, estado')
          .eq('estado', 'En tránsito'),
        // Fetch last 4 recent deliveries
        supabase
          .from('conduces')
          .select('id, numero_conduce, razon_social, cantidad_bultos, hora_entrega_exacta, fecha_entrega')
          .eq('estado', 'Entregado')
          .order('updated_at', { ascending: false })
          .limit(4)
      ]);

      // Procesar resultados
      const norteStats = (norteResult.data?.[0] || {}) as RegionStats;
      const surStats = (surResult.data?.[0] || {}) as RegionStats;
      
      // Calcular estadísticas de camiones
      const truckMap = new Map<string, { clientCount: number; bultos: number }>();
      
      if (truckStatsResult.data) {
        for (const conduce of truckStatsResult.data) {
          if (conduce.encomendado) {
            const existing = truckMap.get(conduce.encomendado) || { clientCount: 0, bultos: 0 };
            existing.clientCount++;
            existing.bultos += conduce.cantidad_bultos || 0;
            truckMap.set(conduce.encomendado, existing);
          }
        }
      }

      const camionesStats = Array.from(truckMap.entries()).map(([truck, data]) => ({
        truck,
        clientCount: data.clientCount,
        bultos: data.bultos,
        conduces: data.clientCount
      }));

      // Procesar conduces atrasados
      const delayedConduces: DelayedConduce[] = [];
      
      // 1. Entregados con tiempo_entrega > umbral
      if (delayedResult.data) {
        for (const c of delayedResult.data) {
          if (!c.tiempo_entrega || c.tiempo_entrega.startsWith('-')) continue;
          
          const isDelayed = isConduceDelayed({
            fechaEntrega: '',
            numeroCliente: c.numero_cliente || '',
            tiempoEntrega: c.tiempo_entrega
          });
          
          if (isDelayed) {
            const hoursMatch = c.tiempo_entrega.match(/(\d+)h/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            
            delayedConduces.push({
              numeroConduce: c.numero_conduce,
              razonSocial: c.razon_social || '',
              cantidadBultos: c.cantidad_bultos,
              diasAtraso: Math.floor(hours / 24),
              encomendado: c.encomendado,
              estado: 'Entregado'
            });
          }
        }
      }
      
      // 2. En tránsito - calcular atraso desde la fecha de entrega programada
      if (enTransitoResult.data) {
        const nowDate = new Date();
        for (const c of enTransitoResult.data) {
          const fechaReferencia = c.fecha_entrega || c.fecha_carga;
          if (!fechaReferencia) continue;

          const tiempoEntrega = calculateDeliveryTime(fechaReferencia, nowDate);
          const isClienteVisitador = isVisitador(c.numero_cliente || '');

          if (!isDeliveryDelayed(tiempoEntrega, isClienteVisitador)) continue;

          const hoursMatch = tiempoEntrega.match(/(\d+)h/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

          delayedConduces.push({
            numeroConduce: c.numero_conduce,
            razonSocial: c.razon_social || '',
            cantidadBultos: c.cantidad_bultos,
            diasAtraso: Math.max(1, Math.floor(hours / 24)),
            encomendado: c.encomendado,
            estado: 'En tránsito'
          });
        }
      }
      
      // Sort by most delayed first
      delayedConduces.sort((a, b) => b.diasAtraso - a.diasAtraso);

      // Process recent deliveries
      const recentDeliveries: RecentDelivery[] = (recentResult.data || []).map(c => ({
        id: c.id,
        numeroConduce: c.numero_conduce,
        razonSocial: c.razon_social || 'Sin cliente',
        cantidadBultos: c.cantidad_bultos,
        horaEntrega: c.hora_entrega_exacta || c.fecha_entrega || ''
      }));

      const newStats: DashboardStats = {
        norteBultos: norteStats.region_bultos_en_transito || 0,
        surBultos: surStats.region_bultos_en_transito || 0,
        delayedCount: delayedConduces.length,
        delayedConduces,
        recentDeliveries,
        camionesStats
      };

      // Guardar en cache
      statsCache.set(cacheKey, {
        data: newStats,
        timestamp: Date.now()
      });

      setStats(newStats);
      
      const duration = (performance.now() - startTime).toFixed(0);
      console.log(`⚡ Dashboard loaded in ${duration}ms`);
      
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  // Refresh function
  const refreshData = useCallback(async (force = false) => {
    if (force) {
      statsCache.delete('dashboard-fast-stats');
    }
    await fetchStats(force);
  }, [fetchStats]);

  return {
    ...stats,
    regionActual,
    setRegionActual,
    isLoading,
    refreshData
  };
}
