import { Conduce } from '@/types/conduces';
import { supabase } from '@/integrations/supabase/client';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';

// Cache optimizado para evitar múltiples llamadas
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos para mejor rendimiento
const MAX_CACHE_SIZE = 25; // Más cache para mejor performance

// Función para limpiar cache cuando se llena
function cleanOldCache() {
  if (cache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_TTL) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => cache.delete(key));
    
    // Si aún está lleno, eliminar el más antiguo
    if (cache.size >= MAX_CACHE_SIZE) {
      const [oldestKey] = cache.keys();
      cache.delete(oldestKey);
    }
  }
}

/**
 * Fetches conduces from Supabase optimized to exclude images
 * Uses pagination for better performance with large datasets
 * @param limit - Optional limit for number of records to fetch (default: no limit)
 */
export async function fetchConducesOptimized(limit?: number): Promise<Conduce[]> {
  // Clave de cache diferente según si hay límite
  const cacheKey = limit ? `conduces-optimized-${limit}` : 'conduces-optimized-all';
  
  // FORZAR RECARGA SIN CACHE para obtener datos frescos
  cache.delete(cacheKey);
  
  console.log(`🚀 FORCING fresh data load - bypassing all cache${limit ? ` (limit: ${limit})` : ''}`);

  // Limpiar cache si es necesario
  cleanOldCache();

  try {
    console.log(`🚀 Fetching optimized conduces (without images)${limit ? ` with limit ${limit}` : ''}...`);
    const startTime = performance.now();
    
    // Si hay límite, usar una query simple
    if (limit) {
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
        .order('fecha_entrega', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Error fetching limited conduces:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No data returned from limited optimized conduces query');
        return [];
      }
      
      // Map data y agregar imagen como null por defecto
      const conduces = data.map(item => {
        const mapped = mapDbConduceToConduce({ ...item, imagen: null });
        return mapped;
      });
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Fetched ${conduces.length} limited conduces optimized in ${duration}s`);
      
      // Cache the result
      cache.set(cacheKey, { data: conduces, timestamp: Date.now() });
      
      return conduces;
    }
    
    // Obtener el conteo total rápido usando RPC para evitar el 500 Internal Server Error por escaneo de tabla grande
    let totalCount = 0;
    let countError = null;
    try {
      const { data: countData, error: rpcError } = await supabase.rpc('get_fast_count', { table_name: 'conduces' });
      if (rpcError || countData === null) {
        throw rpcError || new Error('No count returned');
      }
      totalCount = countData;
    } catch (e) {
      console.warn('⚠️ Error getting fast count via RPC, falling back to HEAD select:', e);
      // Fallback a select count exacto (atrapando errores limpiamente)
      try {
        const { count, error } = await supabase
          .from('conduces')
          .select('id', { count: 'exact', head: true });
        if (error) throw error;
        totalCount = count || 0;
      } catch (err: any) {
        countError = err;
      }
    }
    
    if (countError) {
      console.warn('⚠️ Error getting total count, falling back to direct fetch:', countError);
      // Fallback: fetch without pagination using the same approach as fetchConduces
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('conduces')
        .select(`
          id, numero_conduce, numero_factura, numero_cliente, cantidad_bultos,
          cantidad_entregados, bulto_modificado, nota_modificacion_bulto,
          fecha_carga, fecha_entrega, razon_social, ciudad, estado, laboratorio,
          encomendado, prioridad, tiempo_entrega, hora_entrega_exacta, firma, nota,
          region, excepcion, motivo_excepcion, relacion, created_at, updated_at
        `)
        .order('fecha_entrega', { ascending: false })
        .limit(5000);
      
      if (fallbackError) {
        console.error('❌ Fallback fetch also failed:', fallbackError);
        return [];
      }
      
      const fallbackConduces = (fallbackData || []).map(item => 
        mapDbConduceToConduce({ ...item, imagen: null })
      );
      
      const endTime = performance.now();
      console.log(`✅ Fallback fetched ${fallbackConduces.length} conduces in ${((endTime - startTime) / 1000).toFixed(2)}s`);
      cache.set(cacheKey, { data: fallbackConduces, timestamp: Date.now() });
      return fallbackConduces;
    }
    
    console.log(`📊 Total conduces in DB: ${totalCount}`);
    
    // Si hay más de 1000, hacer múltiples queries
    const allConduces: any[] = [];
    const pageSize = 1000; // Máximo permitido por Supabase
    const totalPages = Math.ceil((totalCount || 0) / pageSize);
    
    console.log(`🔄 Will fetch ${totalPages} pages of ${pageSize} conduces each`);
    
    // Fetch pages in batches of 2 for parallelism with retry logic
    const batchSize = 2;
    const maxRetries = 2;

    const fetchPage = async (page: number, retryCount = 0): Promise<any[]> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      try {
        const { data: pageData, error: pageError } = await supabase
          .from('conduces')
          .select(`
            id, numero_conduce, numero_factura, numero_cliente, cantidad_bultos,
            cantidad_entregados, bulto_modificado, nota_modificacion_bulto,
            fecha_carga, fecha_entrega, razon_social, ciudad, estado, laboratorio,
            encomendado, prioridad, tiempo_entrega, hora_entrega_exacta, firma, nota,
            region, excepcion, motivo_excepcion, relacion, created_at, updated_at
          `)
          .order('fecha_entrega', { ascending: false })
          .range(from, to);
        
        if (pageError) {
          if (retryCount < maxRetries) {
            console.warn(`⚠️ Page ${page + 1} failed, retrying (${retryCount + 1}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
            return fetchPage(page, retryCount + 1);
          }
          console.error(`❌ Error fetching page ${page + 1} after retries:`, pageError);
          return [];
        }
        
        console.log(`✅ Page ${page + 1} loaded: ${pageData?.length || 0} conduces`);
        return pageData || [];
      } catch (err) {
        if (retryCount < maxRetries) {
          console.warn(`⚠️ Page ${page + 1} network error, retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
          return fetchPage(page, retryCount + 1);
        }
        console.error(`❌ Page ${page + 1} failed after retries:`, err);
        return [];
      }
    };

    for (let batchStart = 0; batchStart < totalPages; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalPages);
      const pageNumbers = Array.from({ length: batchEnd - batchStart }, (_, i) => batchStart + i);
      
      console.log(`📄 Fetching pages ${batchStart + 1}-${batchEnd}/${totalPages}`);
      
      const results = await Promise.all(pageNumbers.map(p => fetchPage(p)));
      results.forEach(pageData => allConduces.push(...pageData));
    }
    
    const data = allConduces;
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No data returned from optimized conduces query');
      return [];
    }
    
    // Map data y agregar imagen como null por defecto
    const conduces = data.map(item => {
      const mapped = mapDbConduceToConduce({ ...item, imagen: null });
      return mapped;
    });
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Fetched ${conduces.length} conduces optimized in ${duration}s`);
    
    // Cache the result
    cache.set(cacheKey, { data: conduces, timestamp: Date.now() });
    
    return conduces;
    
  } catch (error) {
    console.error('❌ Error fetching optimized conduces:', error);
    // No relanzar el error, devolver array vacío para evitar romper la aplicación
    console.warn('⚠️ Returning empty array due to catch error');
    return [];
  }
}

// Función para obtener SOLO la imagen de un conduce específico
export async function fetchConduceImage(conduceId: string): Promise<string | null> {
  const cacheKey = `image-${conduceId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📸 Using cached image for conduce ${conduceId}`);
    return cached.data;
  }

  try {
    console.log(`📸 Fetching image for conduce ${conduceId}...`);
    
    const { data, error } = await supabase
      .from('conduces')
      .select('imagen')
      .eq('id', conduceId)
      .single();
    
    if (error) {
      console.error(`❌ Error fetching image for conduce ${conduceId}:`, error);
      return null;
    }
    
    const imageUrl = data?.imagen || null;
    
    // Cache the image
    cache.set(cacheKey, { data: imageUrl, timestamp: Date.now() });
    
    console.log(`✅ Image fetched for conduce ${conduceId}`);
    return imageUrl;
    
  } catch (error) {
    console.error(`❌ Error fetching image for conduce ${conduceId}:`, error);
    return null;
  }
}

// Función para limpiar cache si es necesario
export function clearOptimizedCache() {
  cache.clear();
  console.log('🧹 Optimized conduces cache cleared - forcing fresh data load');
  
  // También limpiar otros caches relacionados
  if (typeof window !== 'undefined') {
    localStorage.removeItem('conduces-cache');
    sessionStorage.clear();
  }
}