import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Batch operation for multiple conduce updates
export async function batchUpdateConduces(updates: Array<{ id: string; data: any }>): Promise<void> {
  if (updates.length === 0) return;
  
  try {
    // Use a single transaction for all updates
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('conduces')
        .update(data)
        .eq('id', id)
    );
    
    const results = await Promise.all(promises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`${errors.length} updates failed`);
    }
  } catch (error) {
    console.error('Error in batch update:', error);
    toast({
      title: "Error",
      description: "Error en operación múltiple",
      variant: "destructive"
    });
    throw error;
  }
}

// Optimized version of entregarConduce with minimal database calls
export async function entregarConduceFast(
  id: string, 
  firma: string, 
  nota: string = '', 
  imagen: string,
  encomendado?: string
): Promise<void> {
  try {
    const updates: any = {
      estado: 'Entregado',
      firma,
      nota,
      imagen,
      hora_entrega_exacta: new Date().toISOString()
    };
    
    if (encomendado) {
      updates.encomendado = encomendado;
    }
    
    const { error } = await supabase
      .from('conduces')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error entregando conduce:', error);
    toast({
      title: "Error",
      description: "No se pudo entregar el conduce",
      variant: "destructive"
    });
    throw error;
  }
}

// Optimized version of devolverConduce
export async function devolverConduceFast(id: string, nota: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conduces')
      .update({ 
        estado: 'Devuelto', 
        nota,
        motivo_excepcion: nota,
        hora_entrega_exacta: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error devolviendo conduce:', error);
    toast({
      title: "Error",
      description: "No se pudo devolver el conduce",
      variant: "destructive"
    });
    throw error;
  }
}

// Batch assign encomendado - more efficient for multiple conduces
export async function asignarEncomendadoBatch(conduceIds: string[], encomendado: string, prioridad: boolean = false): Promise<void> {
  try {
    const { error } = await supabase
      .from('conduces')
      .update({ encomendado, prioridad })
      .in('id', conduceIds);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error asignando encomendado:', error);
    toast({
      title: "Error",
      description: "No se pudo asignar el encomendado",
      variant: "destructive"
    });
    throw error;
  }
}