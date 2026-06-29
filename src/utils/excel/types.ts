export interface ExcelConduceRow {
  numeroConduce: string;
  cantidadBultos: number;
  numeroCliente: string;
  numeroFactura: string;
  fechaCarga?: string; // Fecha original del conduce del Excel
}

/**
 * Row format for Fersuaz Excel imports
 * Format: Fecha de carga | Factura/Conduce | RNC | Bultos
 */
export interface ExcelFersuazRow {
  fechaCarga: string;
  numeroConduce: string;
  rnc: string;
  cantidadBultos: number;
}
