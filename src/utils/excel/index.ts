import { supabase } from '@/integrations/supabase/client';
import { Conduce } from '@/types/conduces';
import { 
  readExcelFile, 
  getJsonFromWorksheet,
  extractConduceRows,
  validateExcelRows 
} from './excelReader';
import { 
  mapExcelRowsToConduces, 
  mapConducesToDbFormat 
} from './conduceMapper';
import { 
  fetchClientes, 
  insertConduces,
  createEmptyClientes,
  createOrFetchClientesByRnc
} from './databaseOperations';
import { extractFersuazRows, validateFersuazRows } from './fersuazExtractor';
import { mapFersuazRowsToConduces } from './fersuazMapper';
import { extractGenericRows, validateGenericRows } from './genericExtractor';
import { mapGenericRowsToConduces } from './genericMapper';

export type ImportFormatType = 'asignados' | 'sin_asignar';

export interface ExcelProcessResult {
  success: boolean;
  message: string;
  conduces?: Conduce[];
  errors?: string[];
  createdClients?: string[];
  duplicateConduces?: Array<{
    numeroConduce: string;
    numeroFactura: string;
    numeroCliente: string;
    razonSocial?: string;
  }>;
}

/**
 * Processes an Excel file with conduces and imports them into the database
 */
export const processConduceExcel = async (
  file: File, 
  laboratorio: string,
  fechaCarga: string,
  fechaSalida: string, 
  region: 'Norte' | 'Sur',
  forceDuplicates: boolean = false,
  formatType: ImportFormatType = 'asignados'
): Promise<ExcelProcessResult> => {
  try {
    // Validate file type
    if (!file.name.endsWith('.xlsx')) {
      return {
        success: false,
        message: 'El archivo debe ser de tipo Excel (.xlsx)',
        errors: ['Formato de archivo inválido']
      };
    }

    console.log('Processing Excel file:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('Laboratorio:', laboratorio, 'Format:', formatType);

    // Read the Excel file
    let worksheet;
    try {
      worksheet = await readExcelFile(file);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      return { 
        success: false, 
        message: 'No se pudo leer el archivo Excel', 
        errors: [(error as Error).message]
      };
    }
    
    let jsonData;
    try {
      jsonData = getJsonFromWorksheet(worksheet);
      console.log('Excel data (first 2 rows):', jsonData.slice(0, 2));
      console.log('Total rows found:', jsonData.length);
    } catch (error) {
      console.error('Error converting worksheet to JSON:', error);
      return { 
        success: false, 
        message: 'Error al procesar la estructura del archivo Excel', 
        errors: [(error as Error).message]
      };
    }
    
    // Validate if the Excel has data
    if (!jsonData || jsonData.length === 0) {
      return { 
        success: false, 
        message: 'El archivo Excel no contiene datos',
        errors: ['Archivo vacío o sin datos reconocibles']
      };
    }

    // "Sin asignar" format takes precedence regardless of laboratorio
    if (formatType === 'sin_asignar') {
      return await processGenericExcel(jsonData, fechaSalida, region, forceDuplicates, laboratorio);
    }

    // Use different processing based on laboratorio
    if (laboratorio === 'Fersuaz' || laboratorio === 'Taapharmaceutica' || laboratorio === 'Innovacion Quimica') {
      return await processFersuazExcel(jsonData, fechaSalida, region, forceDuplicates, laboratorio);
    } else {
      return await processLAMExcel(jsonData, laboratorio, fechaCarga, fechaSalida, region, forceDuplicates);
    }
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return { 
      success: false, 
      message: 'Error al procesar el archivo Excel', 
      errors: [(error as Error).message]
    };
  }
};

/**
 * Process generic ("Sin asignar") Excel format:
 * Fecha | Conduce # | Cliente | Bultos | Destino
 * Conduces are imported without numero_cliente; razon_social/ciudad are filled from the file.
 */
async function processGenericExcel(
  jsonData: any[],
  fechaSalida: string,
  region: 'Norte' | 'Sur',
  forceDuplicates: boolean,
  laboratorio: string
): Promise<ExcelProcessResult> {
  console.log(`Processing GENERIC ("Sin asignar") format Excel for ${laboratorio}`);

  const excelRows = extractGenericRows(jsonData);
  if (excelRows.length === 0) {
    return {
      success: false,
      message: 'No se pudieron extraer filas del archivo Excel',
      errors: ['Formato esperado: Fecha | Conduce # | Cliente | Bultos | Destino']
    };
  }

  const { validRows, invalidRows } = validateGenericRows(excelRows);
  if (validRows.length === 0) {
    return {
      success: false,
      message: 'No se encontraron datos válidos en el archivo Excel',
      errors: [
        'Todas las filas contienen errores o datos faltantes',
        'Formato esperado: Fecha | Conduce # | Cliente | Bultos | Destino'
      ]
    };
  }

  const conduces = mapGenericRowsToConduces(validRows, fechaSalida, region, laboratorio);

  // Duplicate check
  if (!forceDuplicates) {
    const { data: existingConduces, error: existingError } = await supabase
      .from('conduces')
      .select('numero_conduce, numero_factura, numero_cliente, razon_social')
      .in('numero_conduce', conduces.map(c => c.numeroConduce!));

    if (existingError) {
      return {
        success: false,
        message: 'Error al verificar conduces duplicados',
        errors: [existingError.message]
      };
    }

    const duplicateConduces = existingConduces?.map(existing => ({
      numeroConduce: existing.numero_conduce,
      numeroFactura: existing.numero_factura,
      numeroCliente: existing.numero_cliente,
      razonSocial: existing.razon_social
    })) || [];

    if (duplicateConduces.length > 0) {
      return {
        success: false,
        message: `Se encontraron ${duplicateConduces.length} conduces que ya existen en la base de datos`,
        errors: [`Algunos conduces ya existen en la base de datos`],
        duplicateConduces
      };
    }
  }

  try {
    const dbConduces = mapConducesToDbFormat(conduces);
    await insertConduces(dbConduces);
  } catch (error) {
    return {
      success: false,
      message: 'Error al guardar conduces en la base de datos',
      errors: [(error as Error).message]
    };
  }

  const warnings: string[] = [];
  warnings.push(`Los ${conduces.length} conduces fueron importados como "Sin asignar" (sin número de cliente)`);
  if (invalidRows.length > 0) {
    warnings.push(`Se omitieron ${invalidRows.length} filas con datos incompletos`);
  }

  return {
    success: true,
    message: `Se importaron ${conduces.length} conduces (sin asignar) exitosamente`,
    conduces: conduces as Conduce[],
    errors: warnings
  };
}

/**
 * Process Fersuaz Excel format: Fecha de carga | Factura/Conduce | RNC | Bultos
 */
async function processFersuazExcel(
  jsonData: any[],
  fechaSalida: string,
  region: 'Norte' | 'Sur',
  forceDuplicates: boolean,
  laboratorio: string = 'Fersuaz'
): Promise<ExcelProcessResult> {
  console.log(`Processing ${laboratorio} format Excel`);

  // Extract Fersuaz rows
  const excelRows = extractFersuazRows(jsonData);
  console.log(`Extracted ${excelRows.length} Fersuaz rows from Excel`);

  if (excelRows.length === 0) {
    return { 
      success: false, 
      message: 'No se pudieron extraer filas del archivo Excel', 
      errors: ['No se encontraron datos con el formato esperado para Fersuaz']
    };
  }

  // Validate rows
  const { validRows, invalidRows } = validateFersuazRows(excelRows);

  if (validRows.length === 0) {
    return { 
      success: false, 
      message: 'No se encontraron datos válidos en el archivo Excel',
      errors: [
        'Todas las filas contienen errores o datos faltantes',
        'Formato esperado: Fecha de carga | Factura/Conduce | RNC | Bultos',
        ...invalidRows.map(row => `Fila inválida: conduce=${row.numeroConduce}, rnc=${row.rnc}, bultos=${row.cantidadBultos}`)
      ]
    };
  }

  console.log(`Found ${validRows.length} valid Fersuaz rows and ${invalidRows.length} invalid rows`);

  // Get unique RNCs from valid rows
  const rncList = validRows.map(row => row.rnc);
  
  // Create or fetch clients by RNC
  let clientesByRnc: Map<string, any>;
  let createdRncs: string[] = [];
  
  try {
    const result = await createOrFetchClientesByRnc(rncList, region);
    clientesByRnc = result.clientesByRnc;
    createdRncs = result.createdRncs;
  } catch (error) {
    console.error('Error creating/fetching clients by RNC:', error);
    return { 
      success: false, 
      message: 'Error al procesar clientes por RNC', 
      errors: [(error as Error).message]
    };
  }

  // Map rows to conduces
  const conduces = mapFersuazRowsToConduces(validRows, clientesByRnc, fechaSalida, region, laboratorio);

  // Check for duplicates
  if (!forceDuplicates) {
    console.log('Checking for duplicate conduces...');
    const { data: existingConduces, error: existingError } = await supabase
      .from('conduces')
      .select('numero_conduce, numero_factura, numero_cliente, razon_social')
      .in('numero_conduce', conduces.map(c => c.numeroConduce));
    
    if (existingError) {
      console.error('Error checking for duplicates:', existingError);
      return { 
        success: false, 
        message: 'Error al verificar conduces duplicados', 
        errors: [existingError.message]
      };
    }
    
    const duplicateConduces = existingConduces?.map(existing => ({
      numeroConduce: existing.numero_conduce,
      numeroFactura: existing.numero_factura,
      numeroCliente: existing.numero_cliente,
      razonSocial: existing.razon_social
    })) || [];
    
    if (duplicateConduces.length > 0) {
      console.log(`Found ${duplicateConduces.length} duplicate conduces`);
      return { 
        success: false, 
        message: `Se encontraron ${duplicateConduces.length} conduces que ya existen en la base de datos`, 
        errors: [`Error al insertar conduces: Algunos conduces ya existen en la base de datos`],
        duplicateConduces
      };
    }
  }

  // Insert conduces
  try {
    const dbConduces = mapConducesToDbFormat(conduces);
    await insertConduces(dbConduces);
    console.log(`Successfully inserted ${conduces.length} ${laboratorio} conduces into database`);
  } catch (error) {
    console.error('Error inserting conduces into database:', error);
    return { 
      success: false, 
      message: 'Error al guardar conduces en la base de datos', 
      errors: [(error as Error).message]
    };
  }

  // Build warnings
  const warnings: string[] = [];
  if (createdRncs.length > 0) {
    warnings.push(`${createdRncs.length} cliente(s) creados automáticamente por RNC`);
    createdRncs.forEach(rnc => warnings.push(`Cliente creado con RNC: ${rnc}`));
  }
  if (invalidRows.length > 0) {
    warnings.push(`Se omitieron ${invalidRows.length} filas con datos incompletos o inválidos`);
  }

  return { 
    success: true, 
    message: `Se importaron ${conduces.length} conduces de ${laboratorio} exitosamente${warnings.length > 0 ? ' (con advertencias)' : ''}`, 
    conduces: conduces as Conduce[],
    errors: warnings.length > 0 ? warnings : undefined,
    createdClients: createdRncs.length > 0 ? createdRncs : undefined
  };
}

/**
 * Process LAM Excel format (original format)
 */
async function processLAMExcel(
  jsonData: any[],
  laboratorio: string,
  fechaCarga: string,
  fechaSalida: string,
  region: 'Norte' | 'Sur',
  forceDuplicates: boolean
): Promise<ExcelProcessResult> {
  console.log('Processing LAM format Excel');

  // Fetch all clients to match with the imported conduces
  let clientes;
  try {
    clientes = await fetchClientes();
    console.log(`Found ${clientes.length} clientes in database`);
  } catch (error) {
    console.error('Error fetching clientes from database:', error);
    return { 
      success: false, 
      message: 'Error al obtener clientes de la base de datos', 
      errors: [(error as Error).message]
    };
  }
  
  // Process each row from the Excel
  const excelRows = extractConduceRows(jsonData);
  console.log(`Extracted ${excelRows.length} rows from Excel`);
  
  if (excelRows.length === 0) {
    return { 
      success: false, 
      message: 'No se pudieron extraer filas del archivo Excel', 
      errors: ['No se encontraron datos con el formato esperado']
    };
  }
  
  // Filter out invalid rows
  const { validRows, invalidRows } = validateExcelRows(excelRows);
  
  if (validRows.length === 0) {
    console.error('No valid rows found after processing');
    return { 
      success: false, 
      message: 'No se encontraron datos válidos en el archivo Excel',
      errors: [
        'Todas las filas contienen errores o datos faltantes',
        ...invalidRows.map(row => `Fila inválida: ${JSON.stringify(row)}`)
      ]
    };
  }
  
  console.log(`Found ${validRows.length} valid rows and ${invalidRows.length} invalid rows`);
  
  // Check for missing clientes in the database and create them if necessary
  const clientesMap = new Map();
  clientes.forEach(cliente => clientesMap.set(cliente.numeroCliente, cliente));
  
  // Identify missing client numbers
  const missingClienteNumbers = validRows
    .filter(row => !clientesMap.has(row.numeroCliente))
    .map(row => row.numeroCliente);
  
  const uniqueMissingClienteNumbers = [...new Set(missingClienteNumbers)];
  
  let warnings: string[] = [];
  let createdClients: string[] = [];
  
  // If there are missing clients, create them with minimal data
  if (uniqueMissingClienteNumbers.length > 0) {
    console.log(`Creating ${uniqueMissingClienteNumbers.length} missing clients with minimal data`);
    warnings.push(`${uniqueMissingClienteNumbers.length} cliente(s) no existían y se crearon con datos vacíos`);
    uniqueMissingClienteNumbers.forEach(num => warnings.push(`Cliente creado: ${num}`));
    createdClients = [...uniqueMissingClienteNumbers];
    
    try {
      const newClientes = await createEmptyClientes(uniqueMissingClienteNumbers, region);
      clientes = [...clientes, ...newClientes];
      newClientes.forEach(cliente => clientesMap.set(cliente.numeroCliente, cliente));
      console.log(`Successfully created ${newClientes.length} empty clients`);
    } catch (error) {
      console.error('Error creating empty clients:', error);
      return { 
        success: false, 
        message: 'Error al crear clientes vacíos', 
        errors: [(error as Error).message]
      };
    }
  }
  
  // Map Excel rows to Conduces entities with data from clientes
  const conduces = mapExcelRowsToConduces(
    validRows, 
    clientes,
    laboratorio,
    fechaCarga, 
    fechaSalida,
    region
  );
  
  // Check for duplicates before inserting
  if (!forceDuplicates) {
    console.log('Checking for duplicate conduces...');
    const { data: existingConduces, error: existingError } = await supabase
      .from('conduces')
      .select('numero_conduce, numero_factura, numero_cliente, razon_social')
      .in('numero_conduce', conduces.map(c => c.numeroConduce));
    
    if (existingError) {
      console.error('Error checking for duplicates:', existingError);
      return { 
        success: false, 
        message: 'Error al verificar conduces duplicados', 
        errors: [existingError.message]
      };
    }
    
    const duplicateConduces = existingConduces?.map(existing => ({
      numeroConduce: existing.numero_conduce,
      numeroFactura: existing.numero_factura,
      numeroCliente: existing.numero_cliente,
      razonSocial: existing.razon_social
    })) || [];
    
    if (duplicateConduces.length > 0) {
      console.log(`Found ${duplicateConduces.length} duplicate conduces`);
      return { 
        success: false, 
        message: `Se encontraron ${duplicateConduces.length} conduces que ya existen en la base de datos`, 
        errors: [`Error al insertar conduces: Algunos conduces ya existen en la base de datos (error de duplicación)`],
        duplicateConduces
      };
    }
  } else {
    console.log('Forcing import of duplicate conduces...');
  }
  
  // Insert conduces into database
  try {
    const dbConduces = mapConducesToDbFormat(conduces);
    await insertConduces(dbConduces);
    console.log(`Successfully inserted ${conduces.length} conduces into database`);
  } catch (error) {
    console.error('Error inserting conduces into database:', error);
    return { 
      success: false, 
      message: 'Error al guardar conduces en la base de datos', 
      errors: [(error as Error).message]
    };
  }
  
  // Add warnings for invalid rows if any
  if (invalidRows.length > 0) {
    warnings.push(`Se omitieron ${invalidRows.length} filas con datos incompletos o inválidos`);
  }
  
  return { 
    success: true, 
    message: `Se importaron ${conduces.length} conduces exitosamente${warnings.length > 0 ? ' (con advertencias)' : ''}`, 
    conduces: conduces as Conduce[],
    errors: warnings.length > 0 ? warnings : undefined,
    createdClients: createdClients.length > 0 ? createdClients : undefined
  };
}
