import { supabase } from '@/integrations/supabase/client';
import { mapDbClienteToCliente } from '../dataMappers';
import { Cliente } from '@/types/cliente';
import { fetchClientes as mainFetchClientes } from '@/services/clienteService';

/**
 * Fetches all clients from the database
 * Now using the main fetchClientes function from clienteService to ensure consistency
 */
export const fetchClientes = async (): Promise<Cliente[]> => {
  try {
    console.log('Fetching all clientes in databaseOperations using clienteService implementation...');
    return await mainFetchClientes();
  } catch (error) {
    console.error('Exception fetching clientes:', error);
    throw new Error(`Error al obtener clientes: ${(error as Error).message}`);
  }
};

/**
 * Inserts conduces into the database
 */
export const insertConduces = async (conduces: any[]) => {
  if (!conduces || conduces.length === 0) {
    throw new Error('No hay conduces para insertar');
  }

  try {
    const { error, data } = await supabase
      .from('conduces')
      .insert(conduces)
      .select();
    
    if (error) {
      console.error('Error inserting conduces:', error);
      
      // Check for common error types
      if (error.code === '23505') {
        throw new Error('Algunos conduces ya existen en la base de datos (error de duplicación)');
      } else if (error.code === '23503') {
        throw new Error('Error de referencia: Algunos clientes pueden no existir en la base de datos');
      } else {
        throw new Error(`Error al insertar conduces: ${error.message}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Exception inserting conduces:', error);
    throw new Error(`Error al insertar conduces: ${(error as Error).message}`);
  }
};

/**
 * Creates empty clients in the database with minimal data
 */
export const createEmptyClientes = async (clientesNumeros: string[], defaultZone: 'Norte' | 'Sur' = 'Norte') => {
  if (!clientesNumeros || clientesNumeros.length === 0) {
    return [];
  }

  try {
    // First, check which clients already exist in the database
    const { data: existingClientes, error: fetchError } = await supabase
      .from('clientes')
      .select('numero_cliente')
      .in('numero_cliente', clientesNumeros)
      .order('numero_cliente');
    
    if (fetchError) {
      console.error('Error checking existing clients:', fetchError);
      throw new Error(`Error al verificar clientes existentes: ${fetchError.message}`);
    }
    
    // Create a set of existing client numbers for fast lookup
    const existingClienteNumbers = new Set(existingClientes?.map(c => c.numero_cliente) || []);
    
    // Filter out client numbers that already exist
    const newClienteNumbers = clientesNumeros.filter(num => !existingClienteNumbers.has(num));
    
    if (newClienteNumbers.length === 0) {
      console.log('All clients already exist in database, no new clients to create');
      return [];
    }
    
    console.log(`Creating ${newClienteNumbers.length} new clients out of ${clientesNumeros.length} requested`);

    // Prepare client data for insertion (only for new clients)
    const clientesData = newClienteNumbers.map(numeroCliente => ({
      numero_cliente: numeroCliente,
      razon_social: '',  // Empty string as placeholder
      ciudad: '',        // Empty string as placeholder
      zona: defaultZone  // Set default zone
    }));

    const { data, error } = await supabase
      .from('clientes')
      .insert(clientesData)
      .select();
    
    if (error) {
      console.error('Error creating empty clients:', error);
      throw new Error(`Error al crear clientes vacíos: ${error.message}`);
    }
    
    // Return both newly created clients and existing ones that were in the original request
    if (existingClientes && existingClientes.length > 0) {
      const { data: fullExistingData } = await supabase
        .from('clientes')
        .select('*')
        .in('numero_cliente', Array.from(existingClienteNumbers))
        .order('numero_cliente');
        
      return [...(data || []), ...(fullExistingData || [])].map(mapDbClienteToCliente);
    }
    
    return (data || []).map(mapDbClienteToCliente);
  } catch (error) {
    console.error('Exception creating empty clients:', error);
    throw new Error(`Error al crear clientes vacíos: ${(error as Error).message}`);
  }
};

/**
 * Creates or fetches clients by RNC for Fersuaz imports
 * If a client with the RNC already exists, returns that client
 * If not, creates a new client with the RNC as the numero_cliente
 */
export const createOrFetchClientesByRnc = async (
  rncList: string[], 
  defaultZone: 'Norte' | 'Sur' = 'Norte'
): Promise<{ clientesByRnc: Map<string, Cliente>; createdRncs: string[] }> => {
  if (!rncList || rncList.length === 0) {
    return { clientesByRnc: new Map(), createdRncs: [] };
  }

  // Get unique RNCs, filtering out empty/invalid values
  const uniqueRncs = [...new Set(rncList)].filter(rnc => rnc && rnc.trim().length > 0);
  console.log(`Processing ${uniqueRncs.length} unique RNCs for Fersuaz import`);
  
  if (uniqueRncs.length === 0) {
    return { clientesByRnc: new Map(), createdRncs: [] };
  }

  try {
    // First, check which clients already exist by RNC
    const { data: existingByRnc, error: rncError } = await supabase
      .from('clientes')
      .select('*')
      .in('rnc', uniqueRncs);

    if (rncError) {
      console.error('Error checking existing clients by RNC:', rncError);
      throw new Error(`Error al verificar clientes por RNC: ${rncError.message}`);
    }

    // Also check by numero_cliente (in case RNC is used as numero_cliente)
    const { data: existingByNumero, error: numeroError } = await supabase
      .from('clientes')
      .select('*')
      .in('numero_cliente', uniqueRncs);

    if (numeroError) {
      console.error('Error checking existing clients by numero_cliente:', numeroError);
      throw new Error(`Error al verificar clientes por numero_cliente: ${numeroError.message}`);
    }

    // Create a map of RNC -> Cliente
    const clientesByRnc = new Map<string, Cliente>();
    
    // Add clients found by RNC
    (existingByRnc || []).forEach(c => {
      if (c.rnc) {
        clientesByRnc.set(c.rnc, mapDbClienteToCliente(c));
      }
    });
    
    // Add clients found by numero_cliente (use numero_cliente as key if no RNC match)
    (existingByNumero || []).forEach(c => {
      if (!clientesByRnc.has(c.numero_cliente)) {
        clientesByRnc.set(c.numero_cliente, mapDbClienteToCliente(c));
      }
    });

    console.log(`Found ${clientesByRnc.size} existing clients for RNCs`);

    // Identify RNCs that need new clients
    const missingRncs = uniqueRncs.filter(rnc => !clientesByRnc.has(rnc));
    
    if (missingRncs.length === 0) {
      console.log('All RNCs have existing clients');
      return { clientesByRnc, createdRncs: [] };
    }

    console.log(`Creating ${missingRncs.length} new clients for missing RNCs`);

    // Create new clients with RNC as both numero_cliente and rnc
    const newClientesData = missingRncs.map(rnc => ({
      numero_cliente: rnc, // Use RNC as numero_cliente
      rnc: rnc,
      razon_social: '',    // Empty, to be filled later
      ciudad: '',          // Empty, to be filled later
      zona: defaultZone
    }));

    const { data: newClientes, error: insertError } = await supabase
      .from('clientes')
      .insert(newClientesData)
      .select();

    if (insertError) {
      console.error('Error creating clients by RNC:', insertError);
      throw new Error(`Error al crear clientes por RNC: ${insertError.message}`);
    }

    // Add newly created clients to the map
    (newClientes || []).forEach(c => {
      if (c.rnc) {
        clientesByRnc.set(c.rnc, mapDbClienteToCliente(c));
      }
    });

    console.log(`Successfully created ${missingRncs.length} new clients by RNC`);

    return { 
      clientesByRnc, 
      createdRncs: missingRncs 
    };
  } catch (error) {
    console.error('Exception in createOrFetchClientesByRnc:', error);
    throw new Error(`Error al procesar clientes por RNC: ${(error as Error).message}`);
  }
};

/**
 * Fetches clients with empty data (missing required information)
 */
export const fetchEmptyClientes = async () => {
  try {
    // Modified query to consider empty strings as well as NULL values
    // This will catch all records where either razon_social OR ciudad are missing or empty
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or('razon_social.eq.,razon_social.eq."",ciudad.eq.,ciudad.eq.""');
    
    if (error) {
      console.error('Error fetching empty clientes:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} clients with incomplete data`);
    return data?.map(mapDbClienteToCliente) || [];
  } catch (error) {
    console.error('Exception fetching empty clientes:', error);
    return [];
  }
};
