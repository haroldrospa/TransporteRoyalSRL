
import { Conduce } from '@/types/conduces';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { mapConduceToDbConduce, mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';

export async function addConduce(conduce: Omit<Conduce, 'id'>): Promise<Conduce | null> {
  try {
    // Map the TypeScript interface to database fields
    const dbConduce = mapConduceToDbConduce(conduce);
    
    // Ensure all required fields are present
    const requiredDbConduce = {
      numero_conduce: dbConduce.numero_conduce!,
      numero_factura: dbConduce.numero_factura!,
      numero_cliente: dbConduce.numero_cliente!,
      cantidad_bultos: dbConduce.cantidad_bultos!,
      fecha_carga: dbConduce.fecha_carga!,
      fecha_entrega: dbConduce.fecha_entrega!,
      estado: dbConduce.estado!,
      laboratorio: dbConduce.laboratorio!,
      region: dbConduce.region!,
      // Optional fields
      cantidad_entregados: dbConduce.cantidad_entregados,
      bulto_modificado: dbConduce.bulto_modificado,
      nota_modificacion_bulto: dbConduce.nota_modificacion_bulto,
      razon_social: dbConduce.razon_social,
      ciudad: dbConduce.ciudad,
      encomendado: dbConduce.encomendado,
      prioridad: dbConduce.prioridad,
      tiempo_entrega: dbConduce.tiempo_entrega,
      firma: dbConduce.firma,
      nota: dbConduce.nota,
      imagen: dbConduce.imagen,
      excepcion: dbConduce.excepcion,
      motivo_excepcion: dbConduce.motivo_excepcion,
      relacion: dbConduce.relacion,
    };

    const { data, error } = await supabase
      .from('conduces')
      .insert(requiredDbConduce)
      .select()
      .single();
    
    if (error) throw error;

    if (data) {
      // Convert the database response back to our TypeScript interface
      return mapDbConduceToConduce(data);
    }
    
    return null;
  } catch (error) {
    console.error('Error adding conduce:', error);
    toast({
      title: "Error",
      description: "No se pudo agregar el conduce",
      variant: "destructive"
    });
    return null;
  }
}

export async function updateConduce(id: string, conduce: Partial<Conduce>): Promise<Conduce | null> {
  try {
    console.log("Updating conduce with ID:", id);
    console.log("Update data:", conduce);
    
    // Map the TypeScript interface to database fields using our mapper function
    const dbConduce = mapConduceToDbConduce(conduce);
    console.log("Database conduce update:", dbConduce);

    const { data, error } = await supabase
      .from('conduces')
      .update(dbConduce)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (data) {
      console.log("Update successful, received data:", data);
      // Convert the database response back to our TypeScript interface
      return mapDbConduceToConduce(data);
    }
    
    return null;
  } catch (error) {
    console.error('Error updating conduce:', error);
    toast({
      title: "Error",
      description: "No se pudo actualizar el conduce",
      variant: "destructive"
    });
    return null;
  }
}

export async function deleteConduce(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conduces')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting conduce:', error);
    toast({
      title: "Error",
      description: "No se pudo eliminar el conduce",
      variant: "destructive"
    });
    return false;
  }
}
