import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Extrae latitud y longitud de una cadena de coordenadas tipo "19.315929, -70.597741"
 * o de un objeto con lat y lon / lng.
 */
export const parseCoordinates = (str?: string | null | any): Coordinates | null => {
  if (!str) return null;
  if (typeof str === 'object' && str !== null) {
    const lat = typeof str.lat === 'number' ? str.lat : parseFloat(str.lat);
    const lon = typeof str.lon === 'number' ? str.lon : (typeof str.lng === 'number' ? str.lng : parseFloat(str.lon || str.lng));
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  // Validar rangos geográficos válidos
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
};

/**
 * Calcula la distancia entre dos coordenadas en kilómetros utilizando la fórmula de Haversine.
 */
export const calculateDistanceKm = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radio medio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formatea una distancia en km a formato legible para el chofer:
 * - Menor a 1 km: en metros (ej. "450 m")
 * - 1 km o más: en kilómetros con un decimal (ej. "2.4 km")
 */
export const formatDistance = (distanceKm: number | null | undefined): string => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Obtiene las coordenadas de un conduce, consultando primero el conduce y luego la caché del cliente.
 */
export const getConduceCoordinates = (
  conduce: Conduce,
  clientResolver?: (numeroCliente: string) => Cliente | null
): Coordinates | null => {
  // 1. Verificar si conduce tiene coordenadas válidas directamente
  const fromConduce = parseCoordinates(conduce.ubicacion);
  if (fromConduce) return fromConduce;

  // 2. Si no, consultar el cliente asociado
  if (clientResolver && conduce.numeroCliente) {
    const client = clientResolver(conduce.numeroCliente);
    if (client?.ubicacion) {
      return parseCoordinates(client.ubicacion);
    }
  }

  return null;
};
