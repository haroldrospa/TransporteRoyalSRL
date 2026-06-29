
import { Conduce } from '@/types/conduces';

// Type for database conduce record
export interface DbConduce {
  id: string;
  numero_conduce: string;
  numero_factura: string;
  numero_cliente: string;
  cantidad_bultos: number;
  cantidad_entregados?: number;
  bulto_modificado?: boolean;
  nota_modificacion_bulto?: string;
  fecha_carga: string;
  fecha_entrega: string;
  razon_social?: string;
  ciudad?: string;
  estado: string;
  laboratorio: string;
  encomendado?: string;
  prioridad?: boolean;
  tiempo_entrega?: string;
  firma?: string;
  nota?: string;
  imagen?: string;
  region: string;
  excepcion?: boolean;
  motivo_excepcion?: string;
  relacion?: string;
  hora_entrega_exacta?: string;
  created_at?: string;
  updated_at?: string;
}

// Convert database conduce to TypeScript interface
export function mapDbConduceToConduce(dbConduce: DbConduce): Conduce {
  return {
    id: dbConduce.id,
    numeroConduce: dbConduce.numero_conduce,
    numeroFactura: dbConduce.numero_factura,
    numeroCliente: dbConduce.numero_cliente,
    cantidadBultos: dbConduce.cantidad_bultos,
    cantidadEntregados: dbConduce.cantidad_entregados,
    bultoModificado: dbConduce.bulto_modificado,
    bultoModificacionNota: dbConduce.nota_modificacion_bulto,
    fechaCarga: dbConduce.fecha_carga,
    fechaEntrega: dbConduce.fecha_entrega,
    razonSocial: dbConduce.razon_social,
    ciudad: dbConduce.ciudad,
    estado: dbConduce.estado as any,
    laboratorio: dbConduce.laboratorio,
    encomendado: dbConduce.encomendado,
    prioridad: dbConduce.prioridad,
    tiempoEntrega: dbConduce.tiempo_entrega,
    firma: dbConduce.firma,
    nota: dbConduce.nota,
    imagen: dbConduce.imagen,
    region: dbConduce.region as any,
    excepcion: dbConduce.excepcion,
    motivoExcepcion: dbConduce.motivo_excepcion,
    relacion: dbConduce.relacion,
    horaEntregaExacta: dbConduce.hora_entrega_exacta,
  };
}

// Convert TypeScript interface to database conduce
export function mapConduceToDbConduce(conduce: Partial<Conduce>): Partial<DbConduce> {
  return {
    id: conduce.id,
    numero_conduce: conduce.numeroConduce,
    numero_factura: conduce.numeroFactura,
    numero_cliente: conduce.numeroCliente,
    cantidad_bultos: conduce.cantidadBultos,
    cantidad_entregados: conduce.cantidadEntregados,
    bulto_modificado: conduce.bultoModificado,
    nota_modificacion_bulto: conduce.bultoModificacionNota,
    fecha_carga: conduce.fechaCarga,
    fecha_entrega: conduce.fechaEntrega,
    razon_social: conduce.razonSocial,
    ciudad: conduce.ciudad,
    estado: conduce.estado,
    laboratorio: conduce.laboratorio,
    encomendado: conduce.encomendado,
    prioridad: conduce.prioridad,
    tiempo_entrega: conduce.tiempoEntrega,
    firma: conduce.firma,
    nota: conduce.nota,
    imagen: conduce.imagen,
    region: conduce.region,
    excepcion: conduce.excepcion,
    motivo_excepcion: conduce.motivoExcepcion,
    relacion: conduce.relacion,
    hora_entrega_exacta: conduce.horaEntregaExacta,
  };
}
