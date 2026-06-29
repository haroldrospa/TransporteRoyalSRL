import { Conduce, Region } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { ExcelConduceRow } from './types';

/**
 * Maps Excel rows to Conduce objects with additional data from clientes
 */
export const mapExcelRowsToConduces = (
  excelRows: ExcelConduceRow[],
  clientes: Cliente[],
  laboratorio: string,  // Laboratorio is now required (LAM or Fersuaz)
  fechaCarga: string,
  fechaEntrega: string,
  region: Region
): Partial<Conduce>[] => {
  // Create a client map for faster lookups
  const clientesMap = new Map();
  clientes.forEach((cliente) => {
    clientesMap.set(cliente.numeroCliente, cliente);
  });

  console.log(`Created client map with ${clientesMap.size} clients for conduce mapping`);

  // Log some diagnostics about the first few clients
  const firstFewKeys = Array.from(clientesMap.keys()).slice(0, 5);
  console.log('Sample client numbers in map:', firstFewKeys);

  // Map each row from Excel to a Conduce object
  return excelRows.map((row) => {
    const cliente = clientesMap.get(row.numeroCliente);
    
    if (!cliente) {
      console.warn(`Client with number ${row.numeroCliente} not found in client map`);
    } else {
      console.log(`Found client for number ${row.numeroCliente}: ${cliente.razonSocial}`);
    }
    
    return {
      numeroConduce: row.numeroConduce,
      numeroFactura: row.numeroFactura,
      numeroCliente: row.numeroCliente,
      cantidadBultos: row.cantidadBultos,
      razonSocial: cliente?.razonSocial || '',
      ciudad: cliente?.ciudad || '',
      fechaCarga: row.fechaCarga || fechaCarga, // Usar fecha del conduce del Excel si existe, sino la seleccionada
      fechaEntrega: fechaEntrega, // Fecha de salida seleccionada por el usuario
      region: region,
      laboratorio: laboratorio, // Use the selected laboratorio (LAM or Fersuaz)
      encomendado: cliente?.encomendado || '',
      estado: 'En tránsito',
    };
  });
};

/**
 * Maps Conduce objects to the format expected by the database
 */
export const mapConducesToDbFormat = (conduces: Partial<Conduce>[]): any[] => {
  return conduces.map((conduce) => ({
    numero_conduce: conduce.numeroConduce,
    numero_factura: conduce.numeroFactura,
    numero_cliente: conduce.numeroCliente,
    cantidad_bultos: conduce.cantidadBultos,
    razon_social: conduce.razonSocial,
    ciudad: conduce.ciudad,
    fecha_carga: conduce.fechaCarga,
    fecha_entrega: conduce.fechaEntrega,
    region: conduce.region,
    laboratorio: conduce.laboratorio,
    encomendado: conduce.encomendado,
    estado: conduce.estado,
  }));
};