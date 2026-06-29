import { Conduce, Region } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { ExcelFersuazRow } from './types';

/**
 * Maps Fersuaz Excel rows to Conduce objects
 * Uses RNC to find the corresponding client
 */
export const mapFersuazRowsToConduces = (
  excelRows: ExcelFersuazRow[],
  clientesByRnc: Map<string, Cliente>,
  fechaEntrega: string,
  region: Region,
  laboratorio: string = 'Fersuaz'
): Partial<Conduce>[] => {
  console.log(`Mapping ${excelRows.length} Fersuaz rows to conduces`);

  return excelRows.map((row) => {
    const cliente = clientesByRnc.get(row.rnc);
    
    if (!cliente) {
      console.warn(`Client with RNC ${row.rnc} not found in client map`);
    } else {
      console.log(`Found client for RNC ${row.rnc}: ${cliente.razonSocial || cliente.numeroCliente}`);
    }
    
    return {
      numeroConduce: row.numeroConduce,
      numeroFactura: '', // Fersuaz format doesn't have separate invoice number
      numeroCliente: cliente?.numeroCliente || row.rnc, // Use RNC as fallback
      cantidadBultos: row.cantidadBultos,
      razonSocial: cliente?.razonSocial || '',
      ciudad: cliente?.ciudad || '',
      fechaCarga: row.fechaCarga,
      fechaEntrega: fechaEntrega,
      region: region,
      laboratorio: laboratorio,
      encomendado: cliente?.encomendado || '',
      estado: 'En tránsito',
    };
  });
};
