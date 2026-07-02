
import { Cliente } from '@/types/cliente';

/**
 * Maps database cliente object to frontend Cliente type
 */
export const mapDbClienteToCliente = (dbCliente: any): Cliente => ({
  id: dbCliente.id,
  rnc: dbCliente.rnc,
  numeroCliente: dbCliente.numero_cliente,
  razonSocial: dbCliente.razon_social,
  ciudad: dbCliente.ciudad,
  encomendado: dbCliente.encomendado,
  ruta: dbCliente.ruta,
  contacto: dbCliente.contacto,
  direccion: dbCliente.direccion,
  ubicacion: dbCliente.ubicacion,
  zona: dbCliente.zona,
  created_at: dbCliente.created_at,
  updated_at: dbCliente.updated_at,
  grupo_cliente: dbCliente.grupo_cliente,
});

/**
 * Maps frontend Cliente type to database schema
 */
export const mapClienteToDbCliente = (cliente: Omit<Cliente, 'id'>) => ({
  rnc: cliente.rnc,
  numero_cliente: cliente.numeroCliente,
  razon_social: cliente.razonSocial,
  ciudad: cliente.ciudad,
  encomendado: cliente.encomendado,
  ruta: cliente.ruta,
  contacto: cliente.contacto,
  direccion: cliente.direccion,
  ubicacion: cliente.ubicacion,
  zona: cliente.zona,
});
