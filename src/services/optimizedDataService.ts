import { supabase } from '@/integrations/supabase/client';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';

// Cache global para evitar re-fetches
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// TTL por tipo de dato
const CACHE_TTLS = {
  dashboard: 2 * 60 * 1000,    // 2 minutos para dashboard
  clientes: 10 * 60 * 1000,    // 10 minutos para clientes  
  conduces: 1 * 60 * 1000,     // 1 minuto para conduces
  stats: 5 * 60 * 1000         // 5 minutos para estadísticas
};

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`Cache hit: ${key}`);
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Servicio optimizado para datos del dashboard
export async function fetchDashboardStats() {
  const cacheKey = 'dashboard-stats';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching optimized dashboard stats...');
    
    const { data, error } = await supabase
      .from('conduces')
      .select(`
        region,
        estado,
        cantidad_bultos,
        encomendado,
        fecha_entrega,
        fecha_carga,
        prioridad
      `)
      .in('estado', ['En tránsito', 'Entregado', 'Devuelto']);

    if (error) throw error;

    const stats = {
      totalConduces: data?.length || 0,
      enTransito: data?.filter(c => c.estado === 'En tránsito').length || 0,
      entregados: data?.filter(c => c.estado === 'Entregado').length || 0,
      data: data || []
    };

    setCachedData(cacheKey, stats, CACHE_TTLS.dashboard);
    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Servicio optimizado para obtener conduces con paginación lazy
export async function fetchConducesLazy(page = 0, pageSize = 100, filters?: any) {
  const cacheKey = `conduces-page-${page}-${pageSize}-${JSON.stringify(filters)}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log(`Fetching conduces page ${page} (lazy)...`);
    
    let query = supabase
      .from('conduces')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Aplicar filtros si existen
    if (filters?.region) {
      query = query.eq('region', filters.region);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const result = {
      data: data?.map(mapDbConduceToConduce) || [],
      count,
      page,
      pageSize,
      hasMore: data ? data.length === pageSize : false
    };

    setCachedData(cacheKey, result, CACHE_TTLS.conduces);
    return result;
  } catch (error) {
    console.error('Error fetching conduces lazy:', error);
    throw error;
  }
}

// Servicio optimizado para clientes con búsqueda
export async function fetchClientesOptimized(search?: string, limit?: number) {
  // NO aplicar límite por defecto - obtener todos los clientes si no se especifica
  const actualLimit = limit || undefined;
  const cacheKey = `clientes-${search || 'all'}-${actualLimit || 'unlimited'}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching optimized clientes...');
    
    let query = supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true });

    // Solo aplicar limit si se especifica explícitamente
    if (actualLimit) {
      query = query.limit(actualLimit);
    }

    if (search) {
      query = query.or(`razon_social.ilike.%${search}%,numero_cliente.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const result = data?.map(mapDbClienteToCliente) || [];
    setCachedData(cacheKey, result, CACHE_TTLS.clientes);
    return result;
  } catch (error) {
    console.error('Error fetching clientes optimized:', error);
    throw error;
  }
}

// Función para limpiar cache manualmente
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  console.log(`Cache cleared ${pattern ? `for pattern: ${pattern}` : 'completely'}`);
}

// Función para obtener estadísticas de cache
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    totalMemory: JSON.stringify(Array.from(cache.values())).length
  };
}