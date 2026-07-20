import { Conduce } from '@/types/conduces';
import { supabase } from '@/integrations/supabase/client';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';

// Cache optimizado
const cache = new Map<string, { data: Conduce[], timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

/**
 * Estrategia de carga progresiva:
 * 1. Primera carga: Solo últimos 90 días (~rápido)
 * 2. Segunda carga: El resto en background
 */

// Columnas comunes para evitar repetición
const CONDUCE_COLUMNS = `
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
`;

/**
 * Carga TODOS los conduces sin límite usando paginación
 * Esta función NO filtra por laboratorio y obtiene todos los registros
 */
export async function fetchAllConducesNoLimit(
  onProgress?: (loaded: number, total: number) => void
): Promise<Conduce[]> {
  const cacheKey = 'conduces-all-no-limit';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('⚡ Using cached all conduces (no limit)');
    return cached.data;
  }

  try {
    console.log('🔄 Loading ALL conduces without limit...');
    const startTime = performance.now();
    
    // Obtener conteo total primero
    const { count: totalCount } = await supabase
      .from('conduces')
      .select('id', { count: 'exact', head: true })
      .neq('estado', 'Pendiente');
    
    const total = totalCount || 0;
    console.log(`📊 Total conduces in database: ${total}`);
    
    // Cargar todos en bloques de 1000
    const pageSize = 1000;
    const allConduces: any[] = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('conduces')
        .select(CONDUCE_COLUMNS)
        .neq('estado', 'Pendiente')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error(`❌ Error page ${page}:`, error);
        break;
      }
      
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allConduces.push(...data);
        onProgress?.(allConduces.length, total);
        hasMore = data.length === pageSize;
        page++;
      }
    }
    
    const conduces = allConduces.map(item => 
      mapDbConduceToConduce({ ...item, imagen: null })
    );
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Loaded ALL ${conduces.length} conduces in ${duration}s`);
    
    cache.set(cacheKey, { data: conduces, timestamp: Date.now() });
    return conduces;
    
  } catch (error) {
    console.error('❌ Error in fetchAllConducesNoLimit:', error);
    return [];
  }
}

/**
 * Carga rápida inicial - Solo datos recientes (últimos 90 días)
 */
export async function fetchRecentConduces(): Promise<Conduce[]> {
  const cacheKey = 'conduces-recent';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('⚡ Using cached recent conduces');
    return cached.data;
  }

  try {
    console.log('⚡ Fetching recent conduces (fast initial load)...');
    const startTime = performance.now();
    
    // Calcular fecha de hace 90 días en formato DD/MM/YYYY (que usa la BD)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // La BD usa formato texto para fechas, así que ordenamos por created_at
    const { data, error } = await supabase
      .from('conduces')
      .select(CONDUCE_COLUMNS)
      .neq('estado', 'Pendiente')
      .order('created_at', { ascending: false })
      .limit(500); // Límite inicial para carga rápida
    
    if (error) {
      console.error('❌ Error fetching recent conduces:', error);
      return [];
    }
    
    const conduces = (data || []).map(item => 
      mapDbConduceToConduce({ ...item, imagen: null })
    );
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Loaded ${conduces.length} recent conduces in ${duration}s`);
    
    cache.set(cacheKey, { data: conduces, timestamp: Date.now() });
    return conduces;
    
  } catch (error) {
    console.error('❌ Error in fetchRecentConduces:', error);
    return [];
  }
}

/**
 * Carga completa en background - Para obtener todos los datos
 */
export async function fetchAllConducesBackground(
  onProgress?: (loaded: number, total: number) => void
): Promise<Conduce[]> {
  const cacheKey = 'conduces-all';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('⚡ Using cached all conduces');
    return cached.data;
  }

  try {
    console.log('🔄 Background loading all conduces...');
    const startTime = performance.now();
    
    // Obtener conteo total
    const { count: totalCount } = await supabase
      .from('conduces')
      .select('id', { count: 'exact', head: true })
      .neq('estado', 'Pendiente');
    
    const total = totalCount || 0;
    console.log(`📊 Total conduces: ${total}`);
    
    // Cargar en paralelo con múltiples requests
    const pageSize = 1000;
    const totalPages = Math.ceil(total / pageSize);
    const allConduces: any[] = [];
    
    // Ejecutar requests en paralelo (máximo 3 a la vez)
    const batchSize = 3;
    for (let batch = 0; batch < totalPages; batch += batchSize) {
      const promises = [];
      
      for (let i = 0; i < batchSize && batch + i < totalPages; i++) {
        const page = batch + i;
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        promises.push(
          supabase
            .from('conduces')
            .select(CONDUCE_COLUMNS)
            .neq('estado', 'Pendiente')
            .order('created_at', { ascending: false })
            .range(from, to)
            .then(({ data, error }) => {
              if (error) {
                console.error(`❌ Error page ${page}:`, error);
                return [];
              }
              return data || [];
            })
        );
      }
      
      const results = await Promise.all(promises);
      results.forEach(pageData => allConduces.push(...pageData));
      
      onProgress?.(allConduces.length, total);
    }
    
    const conduces = allConduces.map(item => 
      mapDbConduceToConduce({ ...item, imagen: null })
    );
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Background loaded ${conduces.length} conduces in ${duration}s`);
    
    cache.set(cacheKey, { data: conduces, timestamp: Date.now() });
    return conduces;
    
  } catch (error) {
    console.error('❌ Error in fetchAllConducesBackground:', error);
    return [];
  }
}

/**
 * Carga optimizada por laboratorio - Solo lo que necesita cada página
 */
export async function fetchConducesByLab(
  laboratorio: 'LAM' | 'Fersuaz' | 'Taapharmaceutica' | 'Innovacion Quimica',
  options?: { limit?: number; offset?: number }
): Promise<Conduce[]> {
  const cacheKey = `conduces-${laboratorio}-${options?.limit || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡ Using cached ${laboratorio} conduces`);
    return cached.data;
  }

  try {
    console.log(`🧪 Fetching ${laboratorio} conduces...`);
    const startTime = performance.now();
    
    let allData: any[] = [];
    
    if (options?.limit && options.limit <= 1000) {
      // If a specific small limit is requested, just do one query
      let query = supabase
        .from('conduces')
        .select(CONDUCE_COLUMNS)
        .neq('estado', 'Pendiente')
        .order('created_at', { ascending: false })
        .limit(options.limit);
        
      if (laboratorio === 'LAM') {
        query = query.or('laboratorio.eq.LAM,laboratorio.is.null,laboratorio.eq.');
      } else {
        query = query.eq('laboratorio', laboratorio);
      }
        
      const { data, error } = await query;
      if (error) {
        console.error(`❌ Error fetching ${laboratorio} conduces:`, error);
        return [];
      }
      allData = data || [];
    } else {
      // Fetch all using parallel pagination to bypass the 1000 default limit
      let countQuery = supabase
        .from('conduces')
        .select('id', { count: 'exact', head: true })
        .neq('estado', 'Pendiente');
        
      if (laboratorio === 'LAM') {
        countQuery = countQuery.or('laboratorio.eq.LAM,laboratorio.is.null,laboratorio.eq.');
      } else {
        countQuery = countQuery.eq('laboratorio', laboratorio);
      }
      
      const { count: totalCount } = await countQuery;
      
      const total = totalCount || 0;
      const pageSize = 1000;
      const totalPages = Math.ceil(total / pageSize);
      
      // Execute requests in parallel (max 4 at a time to not overload)
      const batchSize = 4;
      for (let batch = 0; batch < totalPages; batch += batchSize) {
        const promises = [];
        
        for (let i = 0; i < batchSize && batch + i < totalPages; i++) {
          const page = batch + i;
          const from = page * pageSize;
          const to = from + pageSize - 1;
          
          let batchQuery = supabase
            .from('conduces')
            .select(CONDUCE_COLUMNS)
            .neq('estado', 'Pendiente')
            .order('created_at', { ascending: false })
            .range(from, to);
            
          if (laboratorio === 'LAM') {
            batchQuery = batchQuery.or('laboratorio.eq.LAM,laboratorio.is.null,laboratorio.eq.');
          } else {
            batchQuery = batchQuery.eq('laboratorio', laboratorio);
          }
          
          promises.push(
            batchQuery
              .then(({ data, error }) => {
                if (error) {
                  console.error(`❌ Error fetching ${laboratorio} conduces page ${page}:`, error);
                  return [];
                }
                return data || [];
              })
          );
        }
        
        const results = await Promise.all(promises);
        results.forEach(pageData => allData.push(...pageData));
        
        // If an explicit limit is set, stop when reached
        if (options?.limit && allData.length >= options.limit) {
          allData = allData.slice(0, options.limit);
          break;
        }
      }
    }
    
    const conduces = allData.map(item => 
      mapDbConduceToConduce({ ...item, imagen: null })
    );
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Loaded ${conduces.length} ${laboratorio} conduces in ${duration}s`);
    
    cache.set(cacheKey, { data: conduces, timestamp: Date.now() });
    return conduces;
    
  } catch (error) {
    console.error(`❌ Error in fetchConducesByLab:`, error);
    return [];
  }
}

/**
 * Obtener imagen de un conduce específico
 */
export async function fetchConduceImageProgressive(conduceId: string): Promise<string | null> {
  const cacheKey = `image-${conduceId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[fetchConduceImageProgressive] Found in cache for ${conduceId}, length: ${cached.data[0]?.imagen?.length || 0}`);
    return cached.data[0]?.imagen || null;
  }

  try {
    console.log(`[fetchConduceImageProgressive] Fetching from DB for ${conduceId}...`);
    const { data, error } = await supabase
      .from('conduces')
      .select('imagen')
      .eq('id', conduceId)
      .single();
    
    if (error) {
      console.error(`[fetchConduceImageProgressive] Error:`, error);
      return null;
    }
    
    const imageUrl = data?.imagen || null;
    console.log(`[fetchConduceImageProgressive] Fetched image length: ${imageUrl?.length || 0}`);
    cache.set(cacheKey, { data: [{ imagen: imageUrl }] as any, timestamp: Date.now() });
    return imageUrl;
    
  } catch (err) {
    console.error(`[fetchConduceImageProgressive] Caught error:`, err);
    return null;
  }
}

/**
 * Limpiar cache
 */
export function clearProgressiveCache() {
  cache.clear();
  console.log('🧹 Progressive cache cleared');
}

/**
 * Obtener todos los conduces con estado 'Pendiente' para aprobación del admin.
 */
export async function fetchPendingConduces(): Promise<Conduce[]> {
  try {
    console.log('🔄 Fetching pending conduces for approval...');
    const { data, error } = await supabase
      .from('conduces')
      .select(CONDUCE_COLUMNS)
      .eq('estado', 'Pendiente')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching pending conduces:', error);
      return [];
    }
    
    return (data || []).map(item => 
      mapDbConduceToConduce({ ...item, imagen: null })
    );
  } catch (error) {
    console.error('❌ Error in fetchPendingConduces:', error);
    return [];
  }
}

/**
 * Aprobar un lote de conduces de un laboratorio y fecha de carga específicos.
 * Cambia el estado a 'En tránsito' y asigna la fecha de entrega seleccionada.
 */
export async function approvePendingBatch(
  laboratorio: string,
  fechaCarga: string,
  fechaEntrega: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`✅ Approving batch for ${laboratorio} loaded on ${fechaCarga} with delivery date ${fechaEntrega}...`);
    
    // Obtener primero los ids de los conduces a aprobar
    const { data: pendingItems, error: fetchError } = await supabase
      .from('conduces')
      .select('id, numero_cliente')
      .eq('laboratorio', laboratorio)
      .eq('fecha_carga', fechaCarga)
      .eq('estado', 'Pendiente');
      
    if (fetchError) throw fetchError;
    if (!pendingItems || pendingItems.length === 0) {
      return { success: false, message: 'No se encontraron conduces pendientes para este lote' };
    }
    
    // Obtener los clientes correspondientes para ver su encomendado por defecto
    const clientNumbers = [...new Set(pendingItems.map(item => item.numero_cliente).filter(Boolean))];
    const clientAssignments: Record<string, string | null> = {};
    
    if (clientNumbers.length > 0) {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clientes')
        .select('numero_cliente, encomendado')
        .in('numero_cliente', clientNumbers);
        
      if (!clientsError && clientsData) {
        clientsData.forEach(client => {
          clientAssignments[client.numero_cliente] = client.encomendado;
        });
      }
    }
    
    // Agrupar los conduces por el encomendado que les toca
    const groups: Record<string, string[]> = { unassigned: [] };
    
    pendingItems.forEach(item => {
      const encomendado = item.numero_cliente ? clientAssignments[item.numero_cliente] : null;
      if (encomendado) {
        if (!groups[encomendado]) groups[encomendado] = [];
        groups[encomendado].push(item.id);
      } else {
        groups['unassigned'].push(item.id);
      }
    });
    
    // Actualizar por grupos para asignar el encomendado correcto a cada uno
    const updatePromises = Object.entries(groups).map(async ([encomendado, ids]) => {
      if (ids.length === 0) return null;
      
      const updateData: any = {
        estado: 'En tránsito',
        fecha_entrega: fechaEntrega,
        updated_at: new Date().toISOString()
      };
      
      // Solo asignar si hay un encomendado válido
      if (encomendado !== 'unassigned') {
        updateData.encomendado = encomendado;
      }
      
      const { error: updateError } = await supabase
        .from('conduces')
        .update(updateData)
        .in('id', ids);
        
      if (updateError) throw updateError;
      return true;
    });
    
    await Promise.all(updatePromises);
    
    // Limpiar cache para que se carguen los datos frescos
    clearProgressiveCache();
    
    return { success: true, message: `Lote de ${pendingItems.length} conduces aprobado con éxito` };
  } catch (error) {
    console.error('❌ Error approving pending batch:', error);
    return { success: false, message: (error as Error).message || 'Error al aprobar el lote' };
  }
}

/**
 * Rechazar (eliminar) un lote de conduces de un laboratorio y fecha de carga específicos.
 */
export async function rejectPendingBatch(
  laboratorio: string,
  fechaCarga: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`❌ Rejecting/Deleting batch for ${laboratorio} loaded on ${fechaCarga}...`);
    
    const { data: pendingItems, error: fetchError } = await supabase
      .from('conduces')
      .select('id')
      .eq('laboratorio', laboratorio)
      .eq('fecha_carga', fechaCarga)
      .eq('estado', 'Pendiente');
      
    if (fetchError) throw fetchError;
    if (!pendingItems || pendingItems.length === 0) {
      return { success: false, message: 'No se encontraron conduces pendientes para este lote' };
    }
    
    const ids = pendingItems.map(item => item.id);
    
    // Eliminar los registros
    const { error: deleteError } = await supabase
      .from('conduces')
      .delete()
      .in('id', ids);
      
    if (deleteError) throw deleteError;
    
    clearProgressiveCache();
    
    return { success: true, message: `Lote de ${ids.length} conduces rechazado y eliminado con éxito` };
  } catch (error) {
    console.error('❌ Error rejecting pending batch:', error);
    return { success: false, message: (error as Error).message || 'Error al rechazar el lote' };
  }
}
