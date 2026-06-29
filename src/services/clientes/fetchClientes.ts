import { Cliente } from '@/types/cliente';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';

// Constants for pagination
const PAGE_SIZE = 1000;

export async function fetchClientes(): Promise<Cliente[]> {
  try {
    console.log('Fetching all clientes from database...');
    
    // First get the total count to determine how many pages we need
    const { count } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });
    
    if (count === null) {
      console.error('Error getting client count');
      return [];
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
    console.log(`Successfully fetched ${allClientes.length} clients out of ${count} total in ${duration}ms`);
    
    return allClientes;
  } catch (error) {
    console.error('Error fetching clientes:', error);
    toast({
      title: "Error",
      description: "No se pudieron cargar los clientes",
      variant: "destructive"
    });
    return [];
  }
}
