
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export async function asignarEncomendado(conduceIds: string[], encomendado: string, prioridad: boolean = false): Promise<void> {
  try {
    for (const id of conduceIds) {
      const { error } = await supabase
        .from('conduces')
        .update({ encomendado, prioridad })
        .eq('id', id);
      
      if (error) throw error;
    }
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

export async function entregarConduce(
  id: string, 
  firma: string, 
  nota?: string, 
  imagen?: string,
  encomendado?: string,
  horaEntregaExacta?: string,
  tiempoEntrega?: string
): Promise<void> {
  try {
    const now = new Date();
    const fecha_entrega = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const updates: any = {
      estado: 'Entregado',
      firma,
      nota,
      imagen,
      fecha_entrega,
      hora_entrega_exacta: horaEntregaExacta || now.toISOString(),
      tiempo_entrega: tiempoEntrega
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

export async function devolverConduce(id: string, nota: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conduces')
      .update({ 
        estado: 'Devuelto', 
        nota,
        motivo_excepcion: nota // Guardar el motivo de devolución
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
