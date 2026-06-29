import { supabase } from '@/integrations/supabase/client';
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';
import { smartCache, cacheHelpers } from './smartCache';

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20;
const LARGE_FETCH_SIZE = 100; // For scroll loading

export interface LazyDataFilters {
  region?: string;
  estado?: string;
  encomendado?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  prioridad?: boolean;
}

export interface LazyDataResponse<T> {
  data: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextPage?: number;
  fromCache: boolean;
}

export interface LazyStats {
  totalConduces: number;
  enTransito: number;
  entregados: number;
  devueltos: number;
  bultosEnTransito: number;
  bultosEntregados: number;
  clientesUnicos: number;
}

class LazyDataService {
  /**
   * Fetch conduces with server-side filtering and pagination
   */
  async fetchConduces(
    page = 0,
    limit = DEFAULT_PAGE_SIZE,
    filters: LazyDataFilters = {}
  ): Promise<LazyDataResponse<Conduce>> {
    // Check cache first
    const cachedData = cacheHelpers.getCachedConduces(filters, page, limit);
    if (cachedData) {
      console.log(`📦 Using cached conduces (page ${page})`);
      return cachedData as LazyDataResponse<Conduce>;
    }

    console.log(`🔄 Fetching conduces from Supabase (page ${page}, limit ${limit})`);
    const startTime = performance.now();

    try {
      // Build query with only necessary columns
      let query = supabase
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
          tiempo_entrega,
          hora_entrega_exacta,
          region,
          excepcion,
          motivo_excepcion,
          relacion,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Apply server-side filters
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }
      
      if (filters.encomendado) {
        query = query.eq('encomendado', filters.encomendado);
      }
      
      if (filters.prioridad !== undefined) {
        query = query.eq('prioridad', filters.prioridad);
      }
      
      if (filters.dateFrom && filters.dateTo) {
        query = query.gte('fecha_entrega', filters.dateFrom)
                    .lte('fecha_entrega', filters.dateTo);
      }
      
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.or(`
          numero_conduce.ilike.${searchTerm},
          numero_cliente.ilike.${searchTerm},
          razon_social.ilike.${searchTerm},
          ciudad.ilike.${searchTerm}
        `);
      }

      // Apply pagination
      const from = page * limit;
      const to = from + limit - 1;
      
      query = query.order('fecha_entrega', { ascending: false })
                   .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching conduces:', error);
        throw error;
      }

      if (!data) {
        console.warn('⚠️ No data returned from conduces query');
        return {
          data: [],
          totalCount: 0,
          hasNextPage: false,
          fromCache: false
        };
      }

      // Map data (images will be loaded on demand)
      const conduces = data.map(item => mapDbConduceToConduce({ ...item, imagen: null }));
      
      const totalCount = count || 0;
      const hasNextPage = (from + data.length) < totalCount;
      const nextPage = hasNextPage ? page + 1 : undefined;

      const result: LazyDataResponse<Conduce> = {
        data: conduces,
        totalCount,
        hasNextPage,
        nextPage,
        fromCache: false
      };

      // Cache the result
      smartCache.set(cacheHelpers.conduceKey(filters, page, limit), result);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Fetched ${conduces.length} conduces in ${duration}s (${totalCount} total)`);

      return result;

    } catch (error) {
      console.error('❌ Error in fetchConduces:', error);
      throw error;
    }
  }

  /**
   * Fetch conduces for infinite scroll (larger page size)
   */
  async fetchConducesForScroll(
    page = 0,
    filters: LazyDataFilters = {}
  ): Promise<LazyDataResponse<Conduce>> {
    return this.fetchConduces(page, LARGE_FETCH_SIZE, filters);
  }

  /**
   * Fetch clientes with server-side search and pagination
   */
  async fetchClientes(
    page = 0,
    limit = DEFAULT_PAGE_SIZE,
    search?: string
  ): Promise<LazyDataResponse<Cliente>> {
    // Check cache first
    const cachedData = smartCache.get<LazyDataResponse<Cliente>>(cacheHelpers.clienteKey(search, page, limit));
    if (cachedData) {
      console.log(`📦 Using cached clientes (page ${page})`);
      return cachedData;
    }

    console.log(`🔄 Fetching clientes from Supabase (page ${page}, search: ${search || 'none'})`);
    const startTime = performance.now();

    try {
      let query = supabase
        .from('clientes')
        .select(`
          id,
          numero_cliente,
          razon_social,
          ciudad,
          zona,
          encomendado,
          ruta,
          contacto,
          ubicacion,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Apply search filter
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        query = query.or(`
          numero_cliente.ilike.${searchTerm},
          razon_social.ilike.${searchTerm},
          ciudad.ilike.${searchTerm}
        `);
      }

      // Apply pagination
      const from = page * limit;
      const to = from + limit - 1;
      
      query = query.order('razon_social', { ascending: true })
                   .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching clientes:', error);
        throw error;
      }

      if (!data) {
        return {
          data: [],
          totalCount: 0,
          hasNextPage: false,
          fromCache: false
        };
      }

      // Map data
      const clientes = data.map(item => mapDbClienteToCliente(item));
      
      const totalCount = count || 0;
      const hasNextPage = (from + data.length) < totalCount;
      const nextPage = hasNextPage ? page + 1 : undefined;

      const result: LazyDataResponse<Cliente> = {
        data: clientes,
        totalCount,
        hasNextPage,
        nextPage,
        fromCache: false
      };

      // Cache the result
      smartCache.set(cacheHelpers.clienteKey(search, page, limit), result);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Fetched ${clientes.length} clientes in ${duration}s`);

      return result;

    } catch (error) {
      console.error('❌ Error in fetchClientes:', error);
      throw error;
    }
  }

  /**
   * Fetch optimized stats without loading all data
   */
  async fetchStats(filters: LazyDataFilters = {}): Promise<LazyStats> {
    const cacheKey = cacheHelpers.statsKey(filters.region, { 
      dateFrom: filters.dateFrom, 
      dateTo: filters.dateTo 
    });
    
    const cachedStats = smartCache.get<LazyStats>(cacheKey);
    if (cachedStats) {
      console.log('📊 Using cached stats');
      return cachedStats;
    }

    console.log('📊 Fetching optimized stats from Supabase...');
    const startTime = performance.now();

    try {
      // Build base query for stats
      let query = supabase.from('conduces').select('estado, cantidad_bultos, numero_cliente, region');

      // Apply filters
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      
      if (filters.dateFrom && filters.dateTo) {
        query = query.gte('fecha_entrega', filters.dateFrom)
                    .lte('fecha_entrega', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching stats:', error);
        throw error;
      }

      // Calculate stats from minimal data
      const stats: LazyStats = {
        totalConduces: data?.length || 0,
        enTransito: 0,
        entregados: 0,
        devueltos: 0,
        bultosEnTransito: 0,
        bultosEntregados: 0,
        clientesUnicos: 0
      };

      const uniqueClients = new Set<string>();

      data?.forEach(conduce => {
        if (conduce.numero_cliente) {
          uniqueClients.add(conduce.numero_cliente);
        }

        switch (conduce.estado) {
          case 'En tránsito':
            stats.enTransito++;
            stats.bultosEnTransito += conduce.cantidad_bultos || 0;
            break;
          case 'Entregado':
            stats.entregados++;
            stats.bultosEntregados += conduce.cantidad_bultos || 0;
            break;
          case 'Devuelto':
            stats.devueltos++;
            break;
        }
      });

      stats.clientesUnicos = uniqueClients.size;

      // Cache stats
      smartCache.set(cacheKey, stats);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`📊 Stats calculated in ${duration}s`);

      return stats;

    } catch (error) {
      console.error('❌ Error in fetchStats:', error);
      throw error;
    }
  }

  /**
   * Load image for specific conduce on demand
   */
  async loadConduceImage(conduceId: string): Promise<string | null> {
    const cacheKey = cacheHelpers.imageKey(conduceId);
    const cachedImage = smartCache.get<string>(cacheKey);
    
    if (cachedImage) {
      console.log(`📸 Using cached image for conduce ${conduceId}`);
      return cachedImage;
    }

    try {
      console.log(`📸 Loading image for conduce ${conduceId}...`);
      
      const { data, error } = await supabase
        .from('conduces')
        .select('imagen')
        .eq('id', conduceId)
        .single();

      if (error) {
        console.error(`❌ Error loading image for conduce ${conduceId}:`, error);
        return null;
      }

      const imageUrl = data?.imagen || null;
      
      // Cache the image
      smartCache.set(cacheKey, imageUrl);
      
      console.log(`✅ Image loaded for conduce ${conduceId}`);
      return imageUrl;

    } catch (error) {
      console.error(`❌ Error loading image for conduce ${conduceId}:`, error);
      return null;
    }
  }

  /**
   * Invalidate cache for data refresh
   */
  invalidateCache(type?: 'conduces' | 'clientes' | 'stats' | 'all'): void {
    switch (type) {
      case 'conduces':
        cacheHelpers.invalidateConduces();
        break;
      case 'clientes':
        cacheHelpers.invalidateClientes();
        break;
      case 'stats':
        smartCache.clearPattern('^stats:');
        break;
      default:
        smartCache.clear();
        break;
    }
    
    console.log(`🧹 Cache invalidated for: ${type || 'all'}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return smartCache.getStats();
  }
}

// Export singleton instance
export const lazyDataService = new LazyDataService();