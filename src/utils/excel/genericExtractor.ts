import { Region } from '@/types/conduces';

/**
 * Extractor for the "Sin asignar" / generic format:
 * Conduce # | Razon Social | Bultos | Región | Fecha | Destino
 *
 * No client number / RNC is available — conduces are imported with
 * numero_cliente = null and razon_social / ciudad filled from the Excel.
 * Region is read per-row (Norte/Sur).
 */
export interface ExcelGenericRow {
  fechaCarga: string;
  numeroConduce: string;
  cliente: string;
  cantidadBultos: number;
  destino: string;
  region?: Region;
}

const parseFecha = (fechaValue: any): string => {
  if (!fechaValue) return '';

  if (fechaValue instanceof Date) {
    const day = String(fechaValue.getDate()).padStart(2, '0');
    const month = String(fechaValue.getMonth() + 1).padStart(2, '0');
    const year = fechaValue.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof fechaValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + fechaValue * 86400000);
    const day = String(jsDate.getDate()).padStart(2, '0');
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const year = jsDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof fechaValue === 'string' && fechaValue.trim()) {
    const fechaStr = fechaValue.trim();
    if (fechaStr.includes('-')) {
      const parts = fechaStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    if (fechaStr.includes('.')) {
      return fechaStr.replace(/\./g, '/');
    }
    return fechaStr;
  }

  return '';
};

const parseRegion = (value: any): Region | undefined => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized.startsWith('n')) return 'Norte';
  if (normalized.startsWith('s')) return 'Sur';
  return undefined;
};

export const extractGenericRows = (jsonData: any[]): ExcelGenericRow[] => {
  if (!jsonData || jsonData.length === 0) {
    console.warn('Empty or null jsonData provided to extractGenericRows');
    return [];
  }

  console.log('Generic format - First row headers:', Object.keys(jsonData[0]));

  const rows: ExcelGenericRow[] = [];

  for (const row of jsonData) {
    const values = Object.values(row);

    // Columns: A=Conduce#, B=Razon Social, C=Bultos, D=Región, E=Fecha, F=Destino
    const numeroConduce = String(values[0] ?? '').trim();
    const cliente = String(values[1] ?? '').trim();
    const cantidadBultos = Number(values[2]) || 0;
    const region = parseRegion(values[3]);
    const fechaCarga = parseFecha(values[4]);
    const destino = String(values[5] ?? '').trim();

    if (numeroConduce && cantidadBultos > 0) {
      rows.push({ fechaCarga, numeroConduce, cliente, cantidadBultos, destino, region });
    } else {
      console.warn('Skipping generic row with insufficient data:', {
        fechaCarga,
        numeroConduce,
        cliente,
        cantidadBultos,
        destino,
        region,
      });
    }
  }

  return rows;
};

export const validateGenericRows = (rows: ExcelGenericRow[]) => {
  const validRows: ExcelGenericRow[] = [];
  const invalidRows: ExcelGenericRow[] = [];

  for (const row of rows) {
    if (row.numeroConduce && row.cliente && row.cantidadBultos > 0) {
      validRows.push(row);
    } else {
      invalidRows.push(row);
    }
  }

  return { validRows, invalidRows };
};
