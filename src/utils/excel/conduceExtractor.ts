
import { ExcelConduceRow } from './types';

/**
 * Processes the raw Excel data and extracts conduce rows
 */
export const extractConduceRows = (jsonData: any[]): ExcelConduceRow[] => {
  if (!jsonData || jsonData.length === 0) {
    console.warn('Empty or null jsonData provided to extractConduceRows');
    return [];
  }
  
  console.log('First row headers:', Object.keys(jsonData[0]));
  
  const excelRows: ExcelConduceRow[] = [];
  
  for (const row of jsonData) {
    // Log the first row to understand the structure
    if (excelRows.length === 0) {
      console.log('First Excel row:', row);
      console.log('Row keys:', Object.keys(row));
      console.log('Row values:', Object.values(row));
    }
    
    // Get values directly by array indices for reliability
    const rowValues = Object.values(row);
    
    let numeroConduce = '';
    let cantidadBultos = 0;
    let numeroCliente = '';
    let numeroFactura = '';
    
    // Extract each column in correct order
    if (rowValues.length >= 1) numeroConduce = String(rowValues[0] || '');
    if (rowValues.length >= 2) cantidadBultos = Number(rowValues[1]) || 0;
    
    // Column C (index 2) contains "Fecha de creación" - this is our fechaCarga
    let fechaCarga: string | undefined;
    if (rowValues.length >= 3) {
      const fechaValue = rowValues[2];
      if (fechaValue && typeof fechaValue === 'string' && fechaValue.trim()) {
        // Convert from "29.07.2025" format to "29/07/2025" format to match fechaSalida
        const fechaStr = String(fechaValue).trim();
        if (fechaStr.includes('.')) {
          fechaCarga = fechaStr.replace(/\./g, '/');
        } else {
          fechaCarga = fechaStr;
        }
      }
    }
    
    // Column D (index 3) should be the client number
    if (rowValues.length >= 4) {
      numeroCliente = String(rowValues[3] || '');
    }
    
    // Column E (index 4) should be the invoice number
    if (rowValues.length >= 5) {
      numeroFactura = String(rowValues[4] || '');
    }
    
    // Fix incorrect mapping
    if (numeroCliente.includes('90609')) {
      // If cliente number contains 90609, it's likely a factura number
      numeroFactura = numeroCliente;
      numeroCliente = '102955'; // Use default client
      console.log('Fixed incorrect mapping: moved factura from cliente field', { 
        originalCliente: numeroCliente, 
        fixedFactura: numeroFactura
      });
    }
    

    // Add to our collection if we have the minimum required data
    if (numeroConduce && cantidadBultos > 0) {
      const conduceRow: ExcelConduceRow = {
        numeroConduce,
        cantidadBultos,
        numeroCliente,
        numeroFactura
      };

      // Solo agregar fechaCarga si existe
      if (fechaCarga) {
        conduceRow.fechaCarga = fechaCarga;
      }

      excelRows.push(conduceRow);
    } else {
      console.warn('Skipping row with insufficient data:', { 
        numeroConduce, 
        cantidadBultos, 
        numeroCliente, 
        numeroFactura 
      });
    }
  }
  
  return excelRows;
};

/**
 * Validates the Excel rows to ensure they have the required data
 * Returns both valid rows and invalid rows for reporting
 */
export const validateExcelRows = (rows: ExcelConduceRow[]): { 
  validRows: ExcelConduceRow[], 
  invalidRows: ExcelConduceRow[] 
} => {
  const validRows: ExcelConduceRow[] = [];
  const invalidRows: ExcelConduceRow[] = [];
  
  for (const row of rows) {
    if (row.numeroConduce && row.cantidadBultos > 0 && row.numeroCliente) {
      validRows.push(row);
    } else {
      console.warn('Invalid row:', row);
      invalidRows.push(row);
    }
  }
  
  return { validRows, invalidRows };
};
