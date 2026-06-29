
import * as XLSX from 'xlsx';

/**
 * Reads an Excel file and extracts the data
 */
export const readExcelFile = async (file: File): Promise<XLSX.Sheet> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellDates: true });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('El archivo Excel no contiene hojas de cálculo');
    }
    
    return workbook.Sheets[workbook.SheetNames[0]];
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw new Error(`Error al leer el archivo Excel: ${(error as Error).message}`);
  }
};

/**
 * Converts Excel worksheet to JSON data
 */
export const getJsonFromWorksheet = (worksheet: XLSX.Sheet): any[] => {
  try {
    if (!worksheet) {
      throw new Error('La hoja de cálculo no es válida');
    }
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!Array.isArray(jsonData)) {
      throw new Error('No se pudo convertir la hoja de cálculo a formato JSON');
    }
    
    return jsonData;
  } catch (error) {
    console.error('Error converting worksheet to JSON:', error);
    throw new Error(`Error al procesar la hoja de cálculo: ${(error as Error).message}`);
  }
};
