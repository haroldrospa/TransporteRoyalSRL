
import { Cliente } from '@/types/cliente';

const isGpsCoord = (str?: string | null): boolean => {
  if (!str) return false;
  return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(str.trim());
};

/**
 * Maps database cliente object to frontend Cliente type
 */
export const mapDbClienteToCliente = (dbCliente: any): Cliente => {
  const rawDireccion = (dbCliente.direccion || '').trim();
  const rawUbicacion = (dbCliente.ubicacion || '').trim();

  // If direccion is empty but ubicacion contains a written address (not coordinates)
  let resolvedDireccion = rawDireccion;
  let resolvedUbicacion = rawUbicacion;

  if (!resolvedDireccion && rawUbicacion && !isGpsCoord(rawUbicacion)) {
    resolvedDireccion = rawUbicacion;
    resolvedUbicacion = '';
  } else if (!isGpsCoord(rawUbicacion)) {
    // If rawUbicacion is not a valid coordinate, do not treat it as GPS
    resolvedUbicacion = '';
  }

  return {
    id: dbCliente.id,
    rnc: dbCliente.rnc,
    numeroCliente: dbCliente.numero_cliente,
    razonSocial: dbCliente.razon_social,
    ciudad: dbCliente.ciudad,
    encomendado: dbCliente.encomendado,
    ruta: dbCliente.ruta,
    contacto: dbCliente.contacto,
    direccion: resolvedDireccion,
    ubicacion: resolvedUbicacion,
    zona: dbCliente.zona,
    created_at: dbCliente.created_at,
    updated_at: dbCliente.updated_at,
    grupo_cliente: dbCliente.grupo_cliente,
  };
};

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
