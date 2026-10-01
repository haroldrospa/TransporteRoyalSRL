import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { getConduceCoordinates } from '@/utils/geo/distanceUtils';
import { Usuario } from '@/types/usuarios';
import { formatReadableDate } from '@/utils/dateFormatters';
import { normalizeTruckCode, getRegionByTruck } from '@/utils/trucksByRegion';

export interface TruckCurrentLocation {
  truckName: string;
  driverName?: string;
  lat: number;
  lon: number;
  status: 'en_entrega' | 'en_base' | 'en_ruta' | 'completado';
  lastStopName?: string;
  lastClientNumero?: string;
  lastCity?: string;
  lastTime?: string;
  lastDateTime?: string;
  lastBultosCount?: number;
  lastFactura?: string;
  lastLaboratorio?: string;
  nextStopName?: string;
  nextClientNumero?: string;
  nextCity?: string;
  bultosPendientes: number;
  bultosEntregados: number;
  bultosDevueltos: number;
  totalBultos: number;
  percentEntregado: number;
}

// Coordenadas oficiales de bases de despacho
export const BASE_SANTO_DOMINGO = { lat: 18.4861, lon: -69.9312, name: 'Base Central TransporteRoyal (Santo Domingo)' };
export const BASE_SANTIAGO = { lat: 19.4517, lon: -70.6970, name: 'Base Cibao TransporteRoyal (Santiago)' };

/**
 * Formatea cualquier hora simple (ej: 13:31, 1:31 PM) o timestamp ISO a solo hora legible (ej: 1:31 PM)
 */
export const formatSimpleTime = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.includes(':'))) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
      }
    }
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const m = match[2];
      let ampm = match[3]?.toUpperCase();
      if (!ampm) {
        ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
      }
      return `${hour}:${m} ${ampm}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

/**
 * Formatea de forma humana, clara y completa la fecha y la hora exacta de entrega.
 * Convierte timestamps ISO como '2026-09-29T13:31:48.326+00:00' o combinaciones de fecha y hora
 * a un formato amigable para cualquier persona: ej. '29/09/2026 a las 1:31 PM' (o '1:31 PM' si no hay fecha).
 */
export const formatDeliveryDateTime = (
  rawTime?: string | null,
  rawDate?: string | null
): string => {
  if (!rawTime && !rawDate) return '';
  const timeStr = (rawTime || '').trim();
  const dateStr = (rawDate || '').trim();

  try {
    // 1. Si rawTime ya contiene tanto fecha como hora (ej. ISO: 2026-09-29T13:31:48.326+00:00)
    if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.includes(':'))) {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;

        return `${day}/${month}/${year} a las ${hours}:${minutes} ${ampm}`;
      }
    }

    // 2. Formatear la fecha secundaria si viene separada (ej: 2026-09-29 o 29/09/2026)
    let formattedDate = '';
    if (dateStr) {
      if (dateStr.includes('T') || dateStr.includes('-')) {
        const cleanDate = dateStr.split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } else if (dateStr.includes('/')) {
        formattedDate = dateStr;
      }
    }

    // 3. Formatear la hora
    let formattedTime = '';
    if (timeStr) {
      formattedTime = formatSimpleTime(timeStr);
    }

    // 4. Combinar fecha y hora
    if (formattedDate && formattedTime) {
      return `${formattedDate} a las ${formattedTime}`;
    }
    if (formattedDate) {
      return formattedDate;
    }
    if (formattedTime) {
      return formattedTime;
    }

    return timeStr || dateStr;
  } catch {
    return timeStr || dateStr;
  }
};

/**
 * Filtra y estandariza los conduces para monitoreo en vivo de la ruta activa:
 * 1. Solo conduces cargados en encomendados/camiones (excluyendo almacén).
 * 2. Normaliza el código de camión (ej: 'r-07', 'R-7' -> 'R-07') para evitar duplicados.
 * 3. Conduces en tránsito (los que están en ruta ahora mismo).
 * 4. Conduces entregados o devueltos el día de la ruta activa.
 */
export function filterConducesParaMonitoreo(
  allConduces: Conduce[],
  regionActual?: string
): { filteredConduces: Conduce[]; activeDates: string[] } {
  if (!allConduces || allConduces.length === 0) {
    return { filteredConduces: [], activeDates: [] };
  }

  // 1. Solo camiones / encomendados válidos (NO almacén, NO vacíos, NO 'sin asignar')
  //    y NORMALIZAR el código de camión a su formato canónico (ej. 'R-07')
  const validTruckConduces = allConduces
    .filter((c) => {
      const enc = (c.encomendado || '').trim().toLowerCase();
      if (!enc) return false;
      if (enc.includes('almacen') || enc.includes('almacén')) return false;
      if (enc === 'sin asignar') return false;
      return true;
    })
    .map((c) => ({
      ...c,
      encomendado: normalizeTruckCode(c.encomendado || '')
    }));

  // 2. Filtrar estrictamente por región: la zona oficial del camión tiene prioridad absoluta
  let validList = validTruckConduces;
  if (regionActual && regionActual !== 'Todas') {
    const validTrucksForRegion = new Set(
      getTrucksByRegion(regionActual).map((t) => normalizeTruckCode(t))
    );

    validList = validTruckConduces.filter((c) => {
      const truck = c.encomendado;
      const truckRegion = getRegionByTruck(truck);
      
      // Si el encomendado pertenece a una región oficial conocida (ej. R-01 -> Sur, R-04 -> Norte), esa zona MANDA
      if (truckRegion) {
        return truckRegion === regionActual;
      }
      
      // Si está en la lista de camiones configurada para la región
      if (validTrucksForRegion.has(truck)) {
        return true;
      }

      // Si es un camión no clasificado, usar el campo c.region como fallback
      return c.region === regionActual;
    });
  }

  // 3. Obtener los que están en tránsito (los que están en ruta en los camiones)
  const inTransitConduces = validList.filter((c) => c.estado === 'En tránsito');

  // 4. Identificar las fechas activas de la ruta
  const activeDatesSet = new Set<string>();

  // Agregar fecha de hoy normalizada
  const todayFormatted = formatReadableDate(new Date().toISOString());
  if (todayFormatted && todayFormatted !== '-') {
    activeDatesSet.add(todayFormatted);
  }

  // Agregar fechas de entrega de los conduces actualmente en tránsito
  inTransitConduces.forEach((c) => {
    const norm = formatReadableDate(c.fechaEntrega);
    if (norm && norm !== '-') {
      activeDatesSet.add(norm);
    }
  });

  // 5. Filtrar conduces finales:
  // - En tránsito: siempre incluidos (cargados en ruta)
  // - Entregados o Devueltos: ÚNICAMENTE si su fecha_entrega coincide con las fechas de la ruta activa
  const filteredConduces = validList.filter((c) => {
    if (c.estado === 'En tránsito') {
      return true;
    }

    if (c.estado === 'Entregado' || c.estado === 'Devuelto') {
      const normDate = formatReadableDate(c.fechaEntrega);
      return activeDatesSet.has(normDate);
    }

    return false;
  });

  return {
    filteredConduces,
    activeDates: Array.from(activeDatesSet)
  };
}

/**
 * Determina la ubicación actual estimada o confirmada de cada camión / encomendado
 * Unificando variantes de nombre (ej. R-07, r-07, R-7) en un solo camión único
 */
export function calculateTrucksCurrentLocation(
  conduces: Conduce[],
  getClienteByNumero: (numero: string) => Cliente | null | undefined,
  users: Usuario[] = []
): Map<string, TruckCurrentLocation> {
  const result = new Map<string, TruckCurrentLocation>();

  // Agrupar conduces por encomendado canónico normalizado
  const conducesByTruck = new Map<string, Conduce[]>();

  for (const c of conduces) {
    const rawTruck = (c.encomendado || '').trim();
    if (!rawTruck || rawTruck.toLowerCase().includes('almacen') || rawTruck.toLowerCase() === 'sin asignar') {
      continue;
    }
    const truck = normalizeTruckCode(rawTruck);

    if (!conducesByTruck.has(truck)) {
      conducesByTruck.set(truck, []);
    }
    conducesByTruck.get(truck)!.push({ ...c, encomendado: truck });
  }

  // Mapa de choferes por camión (con clave canónica normalizada)
  const driverByTruck = new Map<string, string>();
  users.forEach((u) => {
    if (u.camion) {
      const cleanCamion = normalizeTruckCode(u.camion);
      const fullName = `${u.nombre || ''} ${u.apellido || ''}`.trim();
      driverByTruck.set(cleanCamion, fullName);
    }
  });

  conducesByTruck.forEach((truckConduces, truckName) => {
    let bultosPendientes = 0;
    let bultosEntregados = 0;
    let bultosDevueltos = 0;
    let pendingConducesWithCoords: { c: Conduce; coords: { lat: number; lon: number } }[] = [];
    let deliveredConducesWithCoords: { c: Conduce; coords: { lat: number; lon: number } }[] = [];

    truckConduces.forEach((c) => {
      const bultos = Number(c.cantidadBultos) || 1;
      const coords = getConduceCoordinates(c, getClienteByNumero as any);

      if (c.estado === 'Entregado') {
        bultosEntregados += Number(c.cantidadEntregados) || bultos;
        if (coords) deliveredConducesWithCoords.push({ c, coords });
      } else if (c.estado === 'Devuelto') {
        bultosDevueltos += bultos;
      } else if (c.estado === 'En tránsito') {
        bultosPendientes += bultos;
        if (coords) pendingConducesWithCoords.push({ c, coords });
      }
    });

    const totalBultos = bultosPendientes + bultosEntregados + bultosDevueltos;
    const percentEntregado = totalBultos > 0 ? Math.round((bultosEntregados / totalBultos) * 100) : 0;
    const driverName = driverByTruck.get(truckName) || undefined;

    // Ordenar entregados por hora más reciente para determinar la última ubicación confirmada
    deliveredConducesWithCoords.sort((a, b) => {
      const timeA = a.c.horaEntregaExacta || a.c.tiempoEntrega || a.c.updated_at || '';
      const timeB = b.c.horaEntregaExacta || b.c.tiempoEntrega || b.c.updated_at || '';
      return timeB.localeCompare(timeA);
    });

    const isAllDelivered = bultosPendientes === 0 && (bultosEntregados > 0 || bultosDevueltos > 0);
    const hasDeliveries = deliveredConducesWithCoords.length > 0;

    let lat = BASE_SANTO_DOMINGO.lat;
    let lon = BASE_SANTO_DOMINGO.lon;
    let status: TruckCurrentLocation['status'] = 'en_base';
    let lastStopName: string | undefined;
    let lastClientNumero: string | undefined;
    let lastCity: string | undefined;
    let lastTime: string | undefined;
    let lastDateTime: string | undefined;
    let lastBultosCount: number | undefined;
    let lastFactura: string | undefined;
    let lastLaboratorio: string | undefined;
    let nextStopName: string | undefined;
    let nextClientNumero: string | undefined;
    let nextCity: string | undefined;

    // Si tiene entregas realizadas hoy, su última ubicación confirmada es la última parada entregada
    if (hasDeliveries) {
      const latestDelivered = deliveredConducesWithCoords[0];
      lat = latestDelivered.coords.lat;
      lon = latestDelivered.coords.lon;
      const client = getClienteByNumero ? getClienteByNumero(latestDelivered.c.numeroCliente) : null;
      lastClientNumero = latestDelivered.c.numeroCliente || client?.numero;
      lastStopName = latestDelivered.c.razonSocial || client?.nombre || `Cliente #${latestDelivered.c.numeroCliente}`;
      lastCity = latestDelivered.c.ciudad || client?.ciudad;
      lastTime = formatSimpleTime(latestDelivered.c.horaEntregaExacta || latestDelivered.c.tiempoEntrega);
      lastDateTime = formatDeliveryDateTime(
        latestDelivered.c.horaEntregaExacta || latestDelivered.c.tiempoEntrega,
        latestDelivered.c.fechaEntrega
      );
      lastBultosCount = Number(latestDelivered.c.cantidadEntregados) || Number(latestDelivered.c.cantidadBultos) || 1;
      lastFactura = latestDelivered.c.numeroFactura;
      lastLaboratorio = latestDelivered.c.laboratorio;
      status = isAllDelivered ? 'completado' : 'en_entrega';
    } else if (pendingConducesWithCoords.length > 0) {
      // Si no ha entregado pero está en ruta con paquetes pendientes
      const firstPending = pendingConducesWithCoords[0];
      const client = getClienteByNumero ? getClienteByNumero(firstPending.c.numeroCliente) : null;
      nextClientNumero = firstPending.c.numeroCliente || client?.numero;
      nextStopName = firstPending.c.razonSocial || client?.nombre || `Cliente #${firstPending.c.numeroCliente}`;
      nextCity = firstPending.c.ciudad || client?.ciudad;
      lat = firstPending.coords.lat;
      lon = firstPending.coords.lon;
      status = 'en_ruta';
    } else {
      // Base central según región
      const isCibao = truckConduces.some((c) => c.region === 'Norte');
      const base = isCibao ? BASE_SANTIAGO : BASE_SANTO_DOMINGO;
      lat = base.lat;
      lon = base.lon;
      lastStopName = base.name;
      status = 'en_base';
    }

    if (pendingConducesWithCoords.length > 0 && !nextStopName) {
      const firstPending = pendingConducesWithCoords[0];
      const client = getClienteByNumero ? getClienteByNumero(firstPending.c.numeroCliente) : null;
      nextClientNumero = firstPending.c.numeroCliente || client?.numero;
      nextStopName = firstPending.c.razonSocial || client?.nombre;
      nextCity = firstPending.c.ciudad || client?.ciudad;
    }

    result.set(truckName, {
      truckName,
      driverName,
      lat,
      lon,
      status,
      lastStopName,
      lastClientNumero,
      lastCity,
      lastTime,
      lastDateTime,
      lastBultosCount,
      lastFactura,
      lastLaboratorio,
      nextStopName,
      nextClientNumero,
      nextCity,
      bultosPendientes,
      bultosEntregados,
      bultosDevueltos,
      totalBultos,
      percentEntregado
    });
  });

  return result;
}
