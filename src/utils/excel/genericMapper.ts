import { Conduce, Region } from '@/types/conduces';
import { ExcelGenericRow } from './genericExtractor';

/**
 * Maps generic ("sin asignar") rows to Conduce objects.
 * - numeroCliente is left null (unassigned)
 * - razonSocial / ciudad come directly from the Excel
 * - region is taken per-row from the Excel; falls back to defaultRegion
 */
export const mapGenericRowsToConduces = (
  rows: ExcelGenericRow[],
  fechaEntrega: string,
  defaultRegion: Region,
  laboratorio: string
): Partial<Conduce>[] => {
  return rows.map((row) => ({
    numeroConduce: row.numeroConduce,
    numeroFactura: '',
    numeroCliente: undefined, // unassigned
    cantidadBultos: row.cantidadBultos,
    razonSocial: row.cliente,
    ciudad: row.destino,
    fechaCarga: row.fechaCarga,
    fechaEntrega,
    region: row.region ?? defaultRegion,
    laboratorio,
    encomendado: '',
    estado: 'En tránsito',
  }));
};
