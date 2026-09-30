import { StopPoint } from './MonitoreoMapa';
import { TruckCurrentLocation } from './truckLocationUtils';

// Cache en memoria para evitar llamadas redundantes a OSRM
const routeCache = new Map<string, [number, number][]>();

/**
 * Ordena las paradas de un camión de forma secuencial y lógica:
 * 1. Paradas ya entregadas (en orden cronológico de entrega)
 * 2. Ubicación actual del camión (posición en tiempo real)
 * 3. Paradas pendientes (ordenadas por el vecino más cercano a partir de la ubicación actual)
 */
export function orderStopsForRoute(
  stops: StopPoint[],
  truckLoc?: TruckCurrentLocation
): { lat: number; lon: number }[] {
  if (!stops || stops.length === 0) {
    return truckLoc ? [{ lat: truckLoc.lat, lon: truckLoc.lon }] : [];
  }

  // 1. Separar paradas entregadas y pendientes
  const deliveredStops: StopPoint[] = [];
  const pendingStops: StopPoint[] = [];

  stops.forEach((s) => {
    if (s.isFullyDelivered || (s.bultosEntregados > 0 && s.bultosPendientes === 0)) {
      deliveredStops.push(s);
    } else {
      pendingStops.push(s);
    }
  });

  // Ordenar paradas entregadas cronológicamente (más antigua primero)
  deliveredStops.sort((a, b) => {
    const timeA = a.latestDeliveryTime || '';
    const timeB = b.latestDeliveryTime || '';
    return timeA.localeCompare(timeB);
  });

  const orderedPoints: { lat: number; lon: number }[] = [];

  // Agregar paradas entregadas
  deliveredStops.forEach((s) => {
    orderedPoints.push({ lat: s.lat, lon: s.lon });
  });

  // Agregar ubicación actual del camión si existe
  let currentRefPoint: { lat: number; lon: number } | null = null;
  if (truckLoc) {
    currentRefPoint = { lat: truckLoc.lat, lon: truckLoc.lon };
    orderedPoints.push(currentRefPoint);
  } else if (orderedPoints.length > 0) {
    currentRefPoint = orderedPoints[orderedPoints.length - 1];
  }

  // Ordenar paradas pendientes mediante el algoritmo de Vecino Más Cercano (Nearest Neighbor)
  if (pendingStops.length > 0) {
    const remaining = [...pendingStops];
    let anchor = currentRefPoint || { lat: remaining[0].lat, lon: remaining[0].lon };

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i];
        // Distancia euclidiana en grados aproximados
        const d = Math.hypot(p.lat - anchor.lat, p.lon - anchor.lon);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = remaining.splice(nearestIdx, 1)[0];
      orderedPoints.push({ lat: nextStop.lat, lon: nextStop.lon });
      anchor = { lat: nextStop.lat, lon: nextStop.lon };
    }
  }

  // Eliminar puntos consecutivos duplicados o extremadamente cercanos (< 15 metros)
  const cleanPoints: { lat: number; lon: number }[] = [];
  for (let i = 0; i < orderedPoints.length; i++) {
    const p = orderedPoints[i];
    if (cleanPoints.length === 0) {
      cleanPoints.push(p);
    } else {
      const prev = cleanPoints[cleanPoints.length - 1];
      const dist = Math.hypot(p.lat - prev.lat, p.lon - prev.lon);
      if (dist > 0.00015) { // ~16 metros
        cleanPoints.push(p);
      }
    }
  }

  return cleanPoints;
}

/**
 * Consulta la API de OSRM (Open Source Routing Machine) para obtener el trazado exacto
 * de las carreteras, avenidas y calles por donde transita la ruta vehicular.
 */
export async function fetchExactStreetRoute(
  points: { lat: number; lon: number }[],
  signal?: AbortSignal
): Promise<[number, number][] | null> {
  if (!points || points.length < 2) {
    return null;
  }

  // Generar clave de caché
  const cacheKey = points.map((p) => `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`).join(';');
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // OSRM permite hasta ~25-30 coordenadas por consulta
  const CHUNK_SIZE = 20;
  const fullGeometry: [number, number][] = [];

  try {
    for (let i = 0; i < points.length - 1; i += (CHUNK_SIZE - 1)) {
      const chunk = points.slice(i, Math.min(i + CHUNK_SIZE, points.length));
      if (chunk.length < 2) break;

      const osrmPoints = chunk.map((p) => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${osrmPoints}?overview=full&geometries=geojson`;

      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // En GeoJSON las coordenadas vienen como [lon, lat], Leaflet usa [lat, lon]
        const segmentCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        if (fullGeometry.length > 0 && segmentCoords.length > 0) {
          fullGeometry.push(...segmentCoords.slice(1));
        } else {
          fullGeometry.push(...segmentCoords);
        }
      }
    }

    if (fullGeometry.length > 0) {
      routeCache.set(cacheKey, fullGeometry);
      return fullGeometry;
    }

    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null;
    }
    console.warn('No se pudo obtener el trazado exacto de calles desde OSRM:', error);
    return null;
  }
}
