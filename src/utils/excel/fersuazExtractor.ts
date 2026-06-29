import { ExcelFersuazRow } from './types';

/**
 * Processes the raw Excel data for Fersuaz format and extracts conduce rows
 * Fersuaz format: Fecha de carga | Factura/Conduce | RNC | Bultos
 */
export const extractFersuazRows = (jsonData: any[]): ExcelFersuazRow[] => {
  if (!jsonData || jsonData.length === 0) {
    console.warn('Empty or null jsonData provided to extractFersuazRows');
    return [];
  }
  
  console.log('Fersuaz format - First row headers:', Object.keys(jsonData[0]));
  
  const excelRows: ExcelFersuazRow[] = [];
  
  for (const row of jsonData) {
    // Log the first row to understand the structure
    if (excelRows.length === 0) {
      console.log('First Fersuaz Excel row:', row);
      console.log('Row keys:', Object.keys(row));
      console.log('Row values:', Object.values(row));
    }
    
    // Get values directly by array indices for reliability
    const rowValues = Object.values(row);
    
    let fechaCarga = '';
    let numeroConduce = '';
    let rnc = '';
    let cantidadBultos = 0;
    
    // Extract each column in correct order for Fersuaz format:
    // Column A (index 0): Fecha de carga
    if (rowValues.length >= 1) {
      const fechaValue = rowValues[0];
      if (fechaValue) {
        if (fechaValue instanceof Date) {
          // xlsx parses Excel dates as JS Date objects
          const d = fechaValue;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          fechaCarga = `${day}/${month}/${year}`;
        } else if (typeof fechaValue === 'number') {
          // Excel serial date number - convert to JS Date
          // Excel epoch is Jan 1, 1900 (with the 1900 leap year bug)
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + fechaValue * 86400000);
          const day = String(jsDate.getDate()).padStart(2, '0');
          const month = String(jsDate.getMonth() + 1).padStart(2, '0');
          const year = jsDate.getFullYear();
          fechaCarga = `${day}/${month}/${year}`;
        } else if (typeof fechaValue === 'string' && fechaValue.trim()) {
          const fechaStr = fechaValue.trim();
          if (fechaStr.includes('-')) {
            const parts = fechaStr.split('-');
            if (parts.length === 3) {
              fechaCarga = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
          } else if (fechaStr.includes('.')) {
            fechaCarga = fechaStr.replace(/\./g, '/');
          } else {
            fechaCarga = fechaStr;
          }
        }
      }
      console.log('Fecha de carga extraída:', fechaCarga, 'valor original:', fechaValue, 'tipo:', typeof fechaValue);
    }
    
    // Column B (index 1): Factura / Conduce
    if (rowValues.length >= 2) {
      numeroConduce = String(rowValues[1] || '').trim();
    }
    
    // Column C (index 2): RNC
    if (rowValues.length >= 3) {
      rnc = String(rowValues[2] || '').trim();
    }
    
    // Column D (index 3): Bultos
    if (rowValues.length >= 4) {
      cantidadBultos = Number(rowValues[3]) || 0;
    }

    // Add to our collection if we have the minimum required data
    if (numeroConduce && cantidadBultos > 0) {
      excelRows.push({
        fechaCarga,
        numeroConduce,
        rnc,
        cantidadBultos
      });
    } else {
      console.warn('Skipping Fersuaz row with insufficient data:', { 
        fechaCarga,
        numeroConduce, 
        rnc,
        cantidadBultos 
      });
    }
  }
  
  return excelRows;
};

/**
 * Validates the Fersuaz Excel rows to ensure they have the required data
 * Returns both valid rows and invalid rows for reporting
 */
export const validateFersuazRows = (rows: ExcelFersuazRow[]): { 
  validRows: ExcelFersuazRow[], 
  invalidRows: ExcelFersuazRow[] 
} => {
  const validRows: ExcelFersuazRow[] = [];
  const invalidRows: ExcelFersuazRow[] = [];
  
  for (const row of rows) {
    // For Fersuaz, we require numeroConduce, rnc, and cantidadBultos > 0
    if (row.numeroConduce && row.rnc && row.cantidadBultos > 0) {
      validRows.push(row);
    } else {
      console.warn('Invalid Fersuaz row:', row);
      invalidRows.push(row);
    }
  }
  
  return { validRows, invalidRows };
};
