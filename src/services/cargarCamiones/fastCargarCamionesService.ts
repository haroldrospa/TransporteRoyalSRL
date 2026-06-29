import { supabase } from '@/integrations/supabase/client';
import { Conduce } from '@/types/conduces';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';

const CONDUCES_CACHE_KEY = 'cargar-camiones-conduces-cache';
const SHIPMENTS_CACHE_KEY = 'cargar-camiones-shipments-cache';
const CACHE_TIMESTAMP_KEY = 'cargar-camiones-cache-timestamp';
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

export interface VerifiedShipment {
  id: string;
  conduce_id?: string;
  conduce_number: string;
  encomendado: string;
  scan_type: string;
  verified_at: string;
  bulto_sequence?: number;
  ciudad?: string;
  user_id?: string;
  user_name?: string;
  conduces?: {
    ciudad?: string;
    cantidad_bultos?: number;
  };
}

interface CachedData {
  conduces: Conduce[];
  shipments: VerifiedShipment[];
  timestamp: number;
}

// Batch queue for background saves
let saveQueue: Array<() => Promise<void>> = [];
let isSaving = false;

// Get cached conduces if valid
function getCachedConduces(): Conduce[] | null {
  try {
    const cached = localStorage.getItem(CONDUCES_CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_DURATION) {
      console.log('🧹 Conduces cache expired');
      localStorage.removeItem(CONDUCES_CACHE_KEY);
      return null;
    }
    
    const data = JSON.parse(cached);
    console.log(`✅ Using cached conduces (${data.length} items, age: ${Math.round(age/1000)}s)`);
    return data;
  } catch (error) {
    console.error('Error reading conduces cache:', error);
    return null;
  }
}

// Get cached shipments if valid
function getCachedShipments(): VerifiedShipment[] | null {
  try {
    const cached = localStorage.getItem(SHIPMENTS_CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_DURATION) {
      console.log('🧹 Shipments cache expired');
      localStorage.removeItem(SHIPMENTS_CACHE_KEY);
      return null;
    }
    
    const data = JSON.parse(cached);
    console.log(`✅ Using cached shipments (${data.length} items, age: ${Math.round(age/1000)}s)`);
    return data;
  } catch (error) {
    console.error('Error reading shipments cache:', error);
    return null;
  }
}

// Save to cache
function saveToCache(conduces: Conduce[], shipments: VerifiedShipment[]) {
  try {
    localStorage.setItem(CONDUCES_CACHE_KEY, JSON.stringify(conduces));
    localStorage.setItem(SHIPMENTS_CACHE_KEY, JSON.stringify(shipments));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`💾 Cached ${conduces.length} conduces and ${shipments.length} shipments`);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Clear cache
export function clearCargarCamionesCache() {
  localStorage.removeItem(CONDUCES_CACHE_KEY);
  localStorage.removeItem(SHIPMENTS_CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log('🧹 Cargar Camiones cache cleared');
}

/**
 * Fetch only "En tránsito" conduces needed for Cargar Camiones
 */
export async function fetchCargarCamionesConduces(): Promise<Conduce[]> {
  console.log('🚀 [FastCargarCamiones] Fetching En tránsito conduces...');
  const startTime = performance.now();
  
  try {
    const { data, error } = await supabase
      .from('conduces')
      .select(`
        id,
        numero_conduce,
        numero_factura,
        numero_cliente,
        cantidad_bultos,
        cantidad_entregados,
        fecha_carga,
        fecha_entrega,
        razon_social,
        ciudad,
        estado,
        laboratorio,
        encomendado,
        prioridad,
        region,
        relacion
      `)
      .eq('estado', 'En tránsito')
      .order('fecha_entrega', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No conduces en tránsito found');
      return [];
    }
    
    const conduces = data.map(item => mapDbConduceToConduce({ ...item, imagen: null }));
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ [FastCargarCamiones] Loaded ${conduces.length} conduces in ${duration}s`);
    
    return conduces;
  } catch (error) {
    console.error('❌ Error fetching cargar camiones conduces:', error);
    return [];
  }
}

/**
 * Fetch verified shipments
 */
export async function fetchVerifiedShipments(): Promise<VerifiedShipment[]> {
  console.log('🚀 [FastCargarCamiones] Fetching verified shipments...');
  const startTime = performance.now();
  
  try {
    // Supabase tiene un límite por defecto de 1000, por lo que hay que usar paginación
    // para obtener más registros
    const allShipments: any[] = [];
    const pageSize = 1000;
    const maxRecords = 5000;
    let currentPage = 0;
    
    while (allShipments.length < maxRecords) {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;
      
      const { data: pageData, error: pageError } = await supabase
        .from('verified_shipments')
        .select('*, conduces(ciudad, cantidad_bultos)')
        .order('verified_at', { ascending: false })
        .range(from, to);
      
      if (pageError) throw pageError;
      
      if (!pageData || pageData.length === 0) break;
      
      allShipments.push(...pageData);
      currentPage++;
      
      // Si obtenemos menos de pageSize, ya no hay más datos
      if (pageData.length < pageSize) break;
    }
    
    const data = allShipments;
    const error = null;
    
    if (error) throw error;
    
    const shipments = data?.map(item => ({
      ...item,
      ciudad: item.conduces?.ciudad || null
    })) || [];
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ [FastCargarCamiones] Loaded ${shipments.length} shipments in ${duration}s`);
    
    return shipments;
  } catch (error) {
    console.error('❌ Error fetching verified shipments:', error);
    return [];
  }
}

/**
 * Get data with cache-first strategy
 */
export async function getCargarCamionesDataWithCache(): Promise<{
  conduces: Conduce[];
  shipments: VerifiedShipment[];
  fromCache: boolean;
}> {
  const cachedConduces = getCachedConduces();
  const cachedShipments = getCachedShipments();
  
  if (cachedConduces && cachedShipments) {
    return {
      conduces: cachedConduces,
      shipments: cachedShipments,
      fromCache: true
    };
  }
  
  // Fetch both in parallel
  const [conduces, shipments] = await Promise.all([
    fetchCargarCamionesConduces(),
    fetchVerifiedShipments()
  ]);
  
  saveToCache(conduces, shipments);
  
  return {
    conduces,
    shipments,
    fromCache: false
  };
}

/**
 * Save shipment in background (non-blocking)
 */
export async function saveShipmentInBackground(
  shipmentData: {
    conduce_id: string | null;
    conduce_number: string;
    encomendado: string;
    scan_type: string;
    bulto_sequence?: number;
    user_id?: string;
    user_name?: string;
  }
): Promise<void> {
  // Add to queue
  saveQueue.push(async () => {
    try {
      const { error } = await supabase
        .from('verified_shipments')
        .insert(shipmentData);
      
      if (error) throw error;
      console.log(`✅ Saved shipment in background: ${shipmentData.conduce_number}`);
    } catch (error) {
      console.error('❌ Error saving shipment in background:', error);
      throw error;
    }
  });
  
  // Process queue if not already processing
  if (!isSaving) {
    processQueue();
  }
}

/**
 * Process the save queue in batches
 */
async function processQueue() {
  if (isSaving || saveQueue.length === 0) return;
  
  isSaving = true;
  console.log(`🔄 Processing ${saveQueue.length} queued shipments...`);
  
  // Process all items in queue
  while (saveQueue.length > 0) {
    const batch = saveQueue.splice(0, 5); // Process 5 at a time
    
    try {
      await Promise.all(batch.map(fn => fn()));
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }
  
  isSaving = false;
  console.log('✅ Queue processed');
}

/**
 * Wait for all pending saves to complete
 */
export async function waitForPendingSaves(): Promise<void> {
  if (saveQueue.length === 0 && !isSaving) return;
  
  console.log('⏳ Waiting for pending saves...');
  
  while (saveQueue.length > 0 || isSaving) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ All saves completed');
}

/**
 * Delete a shipment by conduce number
 */
export async function deleteVerifiedShipment(conduceNumber: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('verified_shipments')
      .delete()
      .eq('conduce_number', conduceNumber);
    
    if (error) throw error;
    console.log(`✅ Deleted shipment: ${conduceNumber}`);
  } catch (error) {
    console.error('❌ Error deleting shipment:', error);
    throw error;
  }
}

/**
 * Clear all verified shipments
 */
export async function clearAllVerifiedShipments(): Promise<void> {
  try {
    const { error } = await supabase
      .from('verified_shipments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) throw error;
    console.log('✅ Cleared all verified shipments');
  } catch (error) {
    console.error('❌ Error clearing shipments:', error);
    throw error;
  }
}
