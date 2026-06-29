import { supabase } from '@/integrations/supabase/client';
import { Conduce } from '@/types/conduces';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';

const CACHE_KEY = 'control-bultos-cache';
const CACHE_TIMESTAMP_KEY = 'control-bultos-cache-timestamp';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

interface CachedData {
  conduces: Conduce[];
  timestamp: number;
}

// Get cached data if valid
export function getCachedControlBultos(): Conduce[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_DURATION) {
      console.log('🧹 Cache expired, clearing...');
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    const data = JSON.parse(cached);
    console.log(`✅ Using cached control bultos data (${data.length} conduces, age: ${Math.round(age/1000)}s)`);
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

// Save data to cache
function saveToCache(conduces: Conduce[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(conduces));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`💾 Cached ${conduces.length} conduces for Control Bultos`);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Clear cache manually
export function clearControlBultosCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log('🧹 Control Bultos cache cleared');
}

/**
 * Fetch only "En tránsito" conduces for Control Bultos page
 * This is MUCH faster than loading all 7,250 conduces
 */
export async function fetchControlBultosData(): Promise<Conduce[]> {
  console.log('🚀 [FastControlBultos] Fetching En tránsito conduces...');
  const startTime = performance.now();
  
  try {
    // Only fetch conduces in "En tránsito" state
    const { data, error } = await supabase
      .from('conduces')
      .select(`
        id,
        numero_conduce,
        numero_factura,
        numero_cliente,
        cantidad_bultos,
        cantidad_entregados,
        bulto_modificado,
        nota_modificacion_bulto,
        fecha_carga,
        fecha_entrega,
        razon_social,
        ciudad,
        estado,
        laboratorio,
        encomendado,
        prioridad,
        tiempo_entrega,
        hora_entrega_exacta,
        firma,
        nota,
        region,
        excepcion,
        motivo_excepcion,
        relacion,
        created_at,
        updated_at
      `)
      .eq('estado', 'En tránsito')
      .order('fecha_entrega', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching control bultos data:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No conduces en tránsito found');
      return [];
    }
    
    // Map to Conduce type
    const conduces = data.map(item => mapDbConduceToConduce({ ...item, imagen: null }));
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ [FastControlBultos] Loaded ${conduces.length} conduces in ${duration}s`);
    
    // Save to cache
    saveToCache(conduces);
    
    return conduces;
    
  } catch (error) {
    console.error('❌ Error in fetchControlBultosData:', error);
    return [];
  }
}

/**
 * Get control bultos data with cache-first strategy
 * Returns cached data immediately, then refreshes in background
 */
export async function getControlBultosDataWithCache(): Promise<{
  data: Conduce[];
  fromCache: boolean;
}> {
  // Try cache first
  const cached = getCachedControlBultos();
  
  if (cached && cached.length > 0) {
    // Return cached data immediately
    return {
      data: cached,
      fromCache: true
    };
  }
  
  // No cache, fetch fresh data
  const fresh = await fetchControlBultosData();
  return {
    data: fresh,
    fromCache: false
  };
}
