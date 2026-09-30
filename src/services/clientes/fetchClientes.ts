import { Cliente } from '@/types/cliente';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';

const CLIENTES_CACHE_KEY = 'clientes-data-cache-v2';
const CLIENTES_CACHE_TIMESTAMP = 'clientes-data-cache-timestamp-v2';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

// Constants for pagination
const PAGE_SIZE = 1000;

/**
 * Get cached clientes from localStorage if available
 */
export function getCachedClientes(): Cliente[] | null {
  try {
    const cached = localStorage.getItem(CLIENTES_CACHE_KEY);
    const ts = localStorage.getItem(CLIENTES_CACHE_TIMESTAMP);
    if (!cached || !ts) return null;
    const data = JSON.parse(cached);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Save clientes to localStorage cache
 */
export function saveClientesToCache(clientes: Cliente[]) {
  try {
    if (!clientes || clientes.length === 0) return;
    localStorage.setItem(CLIENTES_CACHE_KEY, JSON.stringify(clientes));
    localStorage.setItem(CLIENTES_CACHE_TIMESTAMP, Date.now().toString());
  } catch (e) {
    console.warn('⚠️ [fetchClientes] No se pudo guardar clientes en localStorage:', e);
  }
}

/**
 * Update client's encomendado in the localStorage cache immediately
 */
export function updateClienteInCache(numeroClientes: string[], encomendado: string | null) {
  try {
    const cached = getCachedClientes();
    if (!cached) return;
    const cleanNums = new Set(numeroClientes.map(n => String(n).trim()));
    const updated = cached.map(c => {
      if (cleanNums.has(String(c.numeroCliente).trim())) {
        return { ...c, encomendado: encomendado || null };
      }
      return c;
    });
    saveClientesToCache(updated);
  } catch (e) {
    console.warn('⚠️ [fetchClientes] Error actualizando cache de cliente:', e);
  }
}

export async function fetchClientes(): Promise<Cliente[]> {
  try {
    console.log('Fetching all clientes from database...');
    
    // First get the total count to determine how many pages we need
    const { count } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });
    
    if (count === null) {
      console.error('Error getting client count');
      return getCachedClientes() || [];
    }
    
    console.log(`Total clients in database: ${count}`);
    
    // Calculate the number of pages needed
    const pages = Math.ceil(count / PAGE_SIZE);
    console.log(`Fetching ${count} clients using ${pages} paginated requests...`);
    
    // Array to store all clientes
    let allClientes: Cliente[] = [];
    
    // Make paginated requests
    const startTime = performance.now();
    
    for (let page = 0; page < pages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      console.log(`Fetching page ${page+1}/${pages} (range: ${from}-${to})...`);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('razon_social', { ascending: true })
        .range(from, to);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log(`Received ${data.length} clients for page ${page+1}`);
        // Map the database fields to our TypeScript interface
        const mappedClientes = data.map(item => mapDbClienteToCliente(item));
        allClientes = [...allClientes, ...mappedClientes];
      }
    }
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`Successfully fetched ${allClientes.length} clients out of ${count} total in ${duration}s`);
    
    if (allClientes.length > 0) {
      saveClientesToCache(allClientes);
    }
    
    return allClientes;
  } catch (error) {
    console.error('Error fetching clientes:', error);
    const cached = getCachedClientes();
    if (cached && cached.length > 0) {
      console.log(`✅ [fetchClientes] Usando ${cached.length} clientes desde caché tras error`);
      return cached;
    }
    toast({
      title: "Error",
      description: "No se pudieron cargar los clientes",
      variant: "destructive"
    });
    return [];
  }
}
