import { Cliente } from '@/types/cliente';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';

export interface PaginatedClientesResult {
  clientes: Cliente[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetches clientes with server-side pagination and search
 * Much faster than loading all 1700+ clients at once
 */
export async function fetchClientesPaginated(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  searchTerm?: string,
  filterField?: string
): Promise<PaginatedClientesResult> {
  const startTime = performance.now();
  console.log(`📋 Fetching clientes - page ${page}, size ${pageSize}, search: "${searchTerm || 'none'}"`);

  try {
    // Build the query
    let countQuery = supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });

    let dataQuery = supabase
      .from('clientes')
      .select('*');

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      
      // If searching for a specific field
      if (filterField && filterField !== 'all') {
        const fieldMap: Record<string, string> = {
          'numeroCliente': 'numero_cliente',
          'razonSocial': 'razon_social',
          'ciudad': 'ciudad',
          'zona': 'zona',
          'encomendado': 'encomendado',
          'ruta': 'ruta',
          'rnc': 'rnc'
        };
        const dbField = fieldMap[filterField] || filterField;
        countQuery = countQuery.ilike(dbField, `%${search}%`);
        dataQuery = dataQuery.ilike(dbField, `%${search}%`);
      } else {
        // Search across multiple fields
        const searchFilter = `numero_cliente.ilike.%${search}%,razon_social.ilike.%${search}%,ciudad.ilike.%${search}%,zona.ilike.%${search}%,encomendado.ilike.%${search}%,rnc.ilike.%${search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }
    }

    // Get total count first (fast query)
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
      throw countError;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch the actual data
    const { data, error } = await dataQuery
      .order('razon_social', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching clientes:', error);
      throw error;
    }

    const clientes = (data || []).map(item => mapDbClienteToCliente(item));
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Fetched ${clientes.length} of ${totalCount} clientes in ${duration}s`);

    return {
      clientes,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('❌ Error in fetchClientesPaginated:', error);
    throw error;
  }
}

/**
 * Quick count of clients without location
 */
export async function fetchClientesSinUbicacionCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .or('ubicacion.is.null,ubicacion.eq.');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting clients without location:', error);
    return 0;
  }
}

/**
 * Quick count of clients without RNC
 */
export async function fetchClientesSinRncCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .or('rnc.is.null,rnc.eq.');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting clients without RNC:', error);
    return 0;
  }
}

/**
 * Quick total count of all clients
 */
export async function fetchTotalClientesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting total clients:', error);
    return 0;
  }
}
