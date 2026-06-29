import { supabase } from '@/integrations/supabase/client';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';
import { Conduce } from '@/types/conduces';

// Cache ultra agresivo con TTL corto para datos críticos
const ultraCache = new Map<string, { data: any; timestamp: number }>();
const ULTRA_CACHE_TTL = 30000; // 30 segundos

function getUltraCache<T>(key: string): T | null {
  const cached = ultraCache.get(key);
  if (cached && Date.now() - cached.timestamp < ULTRA_CACHE_TTL) {
    return cached.data;
  }
  ultraCache.delete(key);
  return null;
}

function setUltraCache(key: string, data: any): void {
  ultraCache.set(key, { data, timestamp: Date.now() });
}

// Fetch solo estadísticas básicas primero (súper rápido)
export async function fetchBasicEntregasStats(region: string, userCamion?: string): Promise<{
  totalConduces: number;
  totalBultos: number;
  totalClientes: number;
}> {
  // NO usar caché para stats - siempre obtener datos frescos
  console.log(`🎯 UltraFast: Fetching FRESH stats for region: ${region}, camion: ${userCamion || 'admin'}`);

  try {
    let query = supabase
      .from('conduces')
      .select('estado, cantidad_bultos, numero_cliente, encomendado')
      .eq('region', region)
      .eq('estado', 'En tránsito')
      .neq('encomendado', 'Almacen');

    // Si no es admin, filtrar por camión
    if (userCamion) {
      query = query.eq('encomendado', userCamion);
      console.log(`🎯 UltraFast: Filtering by camion: ${userCamion}`);
    } else {
      console.log(`🎯 UltraFast: Admin mode - showing all region data`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('🎯 UltraFast: Error in query:', error);
      throw error;
    }

    console.log(`🎯 UltraFast: Found ${data?.length || 0} pending conduces (already filtered by En tránsito)`);
    console.log('🎯 UltraFast: Sample data (first 3):', data?.slice(0, 3));
    
    if (!data || data.length === 0) {
      console.warn('⚠️ UltraFast: No pending conduces found for this filter!');
      console.warn(`   Region: ${region}, Camion: ${userCamion || 'admin'}`);
      return { totalConduces: 0, totalBultos: 0, totalClientes: 0 };
    }

    // Ya están filtrados por "En tránsito" en la query
    const pendingConduces = data;
    
    // Contar SOLO los bultos de conduces en tránsito
    const totalBultos = pendingConduces.reduce((sum, c) => sum + (c.cantidad_bultos || 0), 0);
    
    // Contar SOLO los clientes únicos de conduces en tránsito
    const uniqueClients = new Set(
      pendingConduces.filter(c => c.numero_cliente)
        .map(c => c.numero_cliente)
    ).size;
    
    // Contar solo los conduces en tránsito
    const pendingCount = pendingConduces.length;

    const stats = {
      totalConduces: pendingCount,
      totalBultos,
      totalClientes: uniqueClients
    };

    console.log('✅ UltraFast: Calculated stats (FRESH):');
    console.log(`  - Pending conduces: ${pendingCount}`);
    console.log(`  - Total bultos: ${totalBultos}`);
    console.log(`  - Unique clients: ${uniqueClients}`);

    return stats;
  } catch (error) {
    console.error('❌ Error fetching basic stats:', error);
    return { totalConduces: 0, totalBultos: 0, totalClientes: 0 };
  }
}

// Fetch TODOS los conduces en tránsito sin límite
export async function fetchPendingConducesOnly(region: string, userCamion?: string, limit?: number) {
  // Cache key sin límite para obtener todos
  const cacheKey = `pending-all-${region}-${userCamion || 'admin'}`;
  const cached = getUltraCache<Conduce[]>(cacheKey);
  if (cached) {
    console.log(`📦 Pending conduces from cache: ${cached.length}`);
    return cached;
  }

  try {
    console.log(`🔍 Fetching ALL pending conduces for region: ${region}, camion: ${userCamion || 'admin'}`);
    
    let query = supabase
      .from('conduces')
      .select(`
        id,
        numero_conduce,
        numero_cliente,
        razon_social,
        numero_factura,
        cantidad_bultos,
        ciudad,
        estado,
        laboratorio,
        fecha_entrega,
        prioridad,
        encomendado,
        created_at
      `)
      .eq('region', region)
      .eq('estado', 'En tránsito')
      .neq('encomendado', 'Almacen')
      .order('prioridad', { ascending: false })
      .order('fecha_entrega', { ascending: true });

    if (userCamion) {
      query = query.eq('encomendado', userCamion);
      console.log(`👤 Filtering pending by camion: ${userCamion}`);
    } else {
      console.log(`👑 Admin mode - showing all pending in region`);
    }

    const { data, error } = await query;
    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} pending conduces`);

    const conduces = data?.map((item: any) => mapDbConduceToConduce(item)) || [];
    setUltraCache(cacheKey, conduces);
    return conduces;
  } catch (error) {
    console.error('❌ Error fetching pending conduces:', error);
    return [];
  }
}

// Fetch conduces completadas (todos los históricos, ordenados por más recientes)
export async function fetchTodayCompletedConduces(region: string, userCamion?: string) {
  const cacheKey = `completed-all-${region}-${userCamion || 'admin'}`;
  const cached = getUltraCache<Conduce[]>(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('conduces')
      .select('*')
      .eq('region', region)
      .eq('estado', 'Entregado')
      .order('created_at', { ascending: false })
      .limit(100); // Aumentar límite para mostrar más históricos

    if (userCamion) {
      query = query.eq('encomendado', userCamion);
    }

    const { data, error } = await query;
    if (error) throw error;

    const conduces = data?.map((item: any) => mapDbConduceToConduce(item)) || [];
    setUltraCache(cacheKey, conduces);
    return conduces;
  } catch (error) {
    console.error('Error fetching completed conduces:', error);
    return [];
  }
}

// Fetch conduces devueltas (todos los históricos, ordenados por más recientes)
export async function fetchTodayReturnedConduces(region: string, userCamion?: string) {
  const cacheKey = `returned-all-${region}-${userCamion || 'admin'}`;
  const cached = getUltraCache<Conduce[]>(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('conduces')
      .select('*')
      .eq('region', region)
      .eq('estado', 'Devuelto')
      .order('created_at', { ascending: false })
      .limit(100); // Aumentar límite para mostrar más históricos

    if (userCamion) {
      query = query.eq('encomendado', userCamion);
    }

    const { data, error } = await query;
    if (error) throw error;

    const conduces = data?.map((item: any) => mapDbConduceToConduce(item)) || [];
    setUltraCache(cacheKey, conduces);
    return conduces;
  } catch (error) {
    console.error('Error fetching returned conduces:', error);
    return [];
  }
}

// Limpiar cache ultra
export function clearUltraCache() {
  ultraCache.clear();
  console.log('🎯 UltraFast: Ultra cache cleared completely');
}

// Preload más conduces en background
export async function preloadMoreConduces(region: string, userCamion?: string, offset = 20, limit = 30) {
  try {
    let query = supabase
      .from('conduces')
      .select('*')
      .eq('region', region)
      .eq('estado', 'En tránsito')
      .neq('encomendado', 'Almacen')
      .order('prioridad', { ascending: false })
      .order('fecha_entrega', { ascending: true })
      .range(offset, offset + limit - 1);

    if (userCamion) {
      query = query.eq('encomendado', userCamion);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.map((item: any) => mapDbConduceToConduce(item)) || [];
  } catch (error) {
    console.error('Error preloading conduces:', error);
    return [];
  }
}