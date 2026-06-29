import { Conduce } from '@/types/conduces';
import { supabase } from '@/integrations/supabase/client';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';

// Columns to fetch - EXCLUDE imagen for lazy loading
const CONDUCE_COLUMNS_NO_IMAGE = `
  id, numero_conduce, numero_factura, numero_cliente, cantidad_bultos,
  cantidad_entregados, bulto_modificado, nota_modificacion_bulto,
  fecha_carga, fecha_entrega, razon_social, ciudad, estado, laboratorio,
  encomendado, prioridad, tiempo_entrega, hora_entrega_exacta, firma, nota,
  region, excepcion, motivo_excepcion, relacion, created_at, updated_at
`;

export async function fetchConduces(): Promise<Conduce[]> {
  try {
    console.log('📦 [fetchConduces] Starting optimized fetch process...');
    
    const startTime = performance.now();
    
    // Strategy: Fetch only the most essential conduces to avoid timeout
    // 1. Get conduces in transit (what we need for Control Bultos)
    // 2. Get recently delivered ones (for LAM page)
    // 3. Limit the total to avoid timeout
    
    console.log('📥 [fetchConduces] Fetching conduces in transit...');
    const { data: transitData, error: transitError } = await supabase
      .from('conduces')
      .select(CONDUCE_COLUMNS_NO_IMAGE)
      .eq('estado', 'En tránsito')
      .order('created_at', { ascending: false });
    
    if (transitError) {
      console.error('❌ [fetchConduces] Error fetching transit conduces:', transitError);
      throw transitError;
    }
    
    console.log(`✅ [fetchConduces] Found ${transitData?.length || 0} conduces in transit`);
    
    // Get recent delivered conduces (last 500 for performance)
    console.log('📥 [fetchConduces] Fetching recent delivered conduces...');
    const { data: deliveredData, error: deliveredError } = await supabase
      .from('conduces')
      .select(CONDUCE_COLUMNS_NO_IMAGE)
      .eq('estado', 'Entregado')
      .order('created_at', { ascending: false })
      .limit(1000); // Límite para delivered para evitar cargar demasiados
    
    if (deliveredError) {
      console.error('❌ [fetchConduces] Error fetching delivered conduces:', deliveredError);
      // Don't throw, continue with just transit data
    }
    
    console.log(`✅ [fetchConduces] Found ${deliveredData?.length || 0} delivered conduces`);
    
    // Get devueltos (should be few)
    console.log('📥 [fetchConduces] Fetching devueltos...');
    const { data: devueltoData, error: devueltoError } = await supabase
      .from('conduces')
      .select(CONDUCE_COLUMNS_NO_IMAGE)
      .eq('estado', 'Devuelto')
      .order('created_at', { ascending: false });
    
    if (devueltoError) {
      console.error('❌ [fetchConduces] Error fetching devuelto conduces:', devueltoError);
      // Don't throw, continue
    }
    
    console.log(`✅ [fetchConduces] Found ${devueltoData?.length || 0} devuelto conduces`);
    
    // Combine all data
    const allData = [
      ...(transitData || []),
      ...(deliveredData || []),
      ...(devueltoData || [])
    ];
    
    console.log(`📊 [fetchConduces] Combined raw data: ${allData.length} records`);
    
    if (allData.length === 0) {
      console.warn('⚠️ [fetchConduces] No data returned from any queries');
      return [];
    }
    
    console.log('🔍 [fetchConduces] First record sample:', allData[0]);
    
    // Map the database fields to our TypeScript interface
    const mappedConduces = allData.map(item => {
      try {
        return mapDbConduceToConduce({ ...item, imagen: null });
      } catch (mapError) {
        console.error('❌ [fetchConduces] Mapping error for item:', item, mapError);
        throw mapError;
      }
    });
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ [fetchConduces] Successfully mapped ${mappedConduces.length} conduces in ${duration}s`);
    
    // Log the states for debugging
    const statesCounts = mappedConduces.reduce((acc, conduce) => {
      acc[conduce.estado] = (acc[conduce.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📈 [fetchConduces] States distribution:', statesCounts);
    
    // Log a sample of mapped conduces
    if (mappedConduces.length > 0) {
      console.log('🔍 [fetchConduces] First mapped conduce sample:', mappedConduces[0]);
    }
    
    return mappedConduces;
  } catch (error) {
    console.error('💥 [fetchConduces] Fatal error:', error);
    throw error;
  }
}
