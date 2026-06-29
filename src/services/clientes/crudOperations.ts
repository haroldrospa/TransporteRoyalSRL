 import { Cliente } from '@/types/cliente';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from '@/hooks/use-toast';
 import { mapClienteToDbCliente, mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';
 
 // Helper to map partial cliente updates to database format
 const mapPartialClienteToDb = (cliente: Partial<Cliente>): Record<string, any> => {
   const dbCliente: Record<string, any> = {};
   
   // Map all possible fields, including RNC
   if (cliente.rnc !== undefined) dbCliente.rnc = cliente.rnc || null;
   if (cliente.numeroCliente !== undefined) dbCliente.numero_cliente = cliente.numeroCliente;
   if (cliente.razonSocial !== undefined) dbCliente.razon_social = cliente.razonSocial;
   if (cliente.ciudad !== undefined) dbCliente.ciudad = cliente.ciudad;
   if (cliente.zona !== undefined) dbCliente.zona = cliente.zona;
   if (cliente.encomendado !== undefined) dbCliente.encomendado = cliente.encomendado || null;
   if (cliente.ruta !== undefined) dbCliente.ruta = cliente.ruta || null;
   if (cliente.contacto !== undefined) dbCliente.contacto = cliente.contacto || null;
   if (cliente.ubicacion !== undefined) dbCliente.ubicacion = cliente.ubicacion || null;
   
   return dbCliente;
 };

export async function addCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente | null> {
  try {
    // Map the TypeScript interface to database fields
    const dbCliente = mapClienteToDbCliente(cliente);

    const { data, error } = await supabase
      .from('clientes')
      .insert(dbCliente)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data) {
      // Map the database response back to our TypeScript interface
      return mapDbClienteToCliente(data);
    }
    
    return null;
  } catch (error) {
    console.error('Error adding cliente:', error);
    toast({
      title: "Error",
      description: "No se pudo agregar el cliente",
      variant: "destructive"
    });
    return null;
  }
}

export async function updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente | null> {
  try {
     console.log('🟢 [ClienteService] updateCliente llamado con ID:', id);
     console.log('🟢 [ClienteService] Datos recibidos:', JSON.stringify(cliente, null, 2));
    
     // Use centralized mapper
     const dbCliente = mapPartialClienteToDb(cliente);
     console.log('🟢 [ClienteService] Datos mapeados para DB:', JSON.stringify(dbCliente, null, 2));
     
     // Verify RNC is included
     if ('rnc' in cliente) {
       console.log('🟢 [ClienteService] RNC presente en datos:', cliente.rnc, '-> DB:', dbCliente.rnc);
     }

    const { data, error } = await supabase
      .from('clientes')
      .update(dbCliente)
      .eq('id', id)
      .select()
      .single();
    
     console.log('🟢 [ClienteService] Respuesta de Supabase:', { data: data ? 'OK' : null, error });
    
    if (error) {
      console.error('❌ [ClienteService] Error de Supabase:', error);
      throw error;
    }
    
    if (data) {
      // Map the database response back to our TypeScript interface
      const mappedData = mapDbClienteToCliente(data);
      console.log('✅ [ClienteService] Cliente actualizado y mapeado:', mappedData);
       console.log('✅ [ClienteService] RNC guardado:', mappedData.rnc);
      return mappedData;
    }
    
    return null;
  } catch (error) {
     console.error('❌ [ClienteService] Error actualizando cliente:', error);
    toast({
      title: "Error",
       description: "No se pudo actualizar el cliente. Intente nuevamente.",
      variant: "destructive"
    });
    return null;
  }
}

export async function deleteCliente(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting cliente:', error);
    toast({
      title: "Error",
      description: "No se pudo eliminar el cliente",
      variant: "destructive"
    });
    return false;
  }
}
