import { useState, useEffect, useCallback, useMemo } from 'react';
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { 
  Coordinates, 
  calculateDistanceKm, 
  formatDistance, 
  getConduceCoordinates 
} from '@/utils/geo/distanceUtils';
import { toast } from '@/hooks/use-toast';

interface UseConduceProximityOptions {
  conduces: Conduce[];
  getClienteByNumero: (numeroCliente: string) => Cliente | null;
  defaultSortByProximity?: boolean;
}

export interface NearestClientInfo {
  conduce: Conduce;
  distanceKm: number;
  formattedDistance: string;
}

export const useConduceProximity = ({
  conduces,
  getClienteByNumero,
  defaultSortByProximity = true
}: UseConduceProximityOptions) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoadingGps, setIsLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [sortByProximity, setSortByProximity] = useState<boolean>(defaultSortByProximity);

  // Solicitar ubicación GPS del usuario
  const requestGpsLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      setGpsError('La geolocalización no es compatible con este dispositivo o navegador.');
      if (!silent) {
        toast({
          title: "GPS no disponible",
          description: "Tu navegador no soporta geolocalización.",
          variant: "destructive"
        });
      }
      return;
    }

    setIsLoadingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserLocation(coords);
        setIsLoadingGps(false);
        setGpsError(null);

        if (!silent) {
          toast({
            title: "Ubicación GPS actualizada",
            description: "Conduces ordenados según tu cercanía actual.",
          });
        }
      },
      (error) => {
        setIsLoadingGps(false);
        let errorMsg = 'No se pudo obtener tu ubicación actual.';
        if (error.code === 1) {
          errorMsg = 'Permiso de GPS denegado. Activa la ubicación en tu navegador.';
        } else if (error.code === 2) {
          errorMsg = 'Ubicación no disponible. Verifica que el GPS de tu móvil esté encendido.';
        } else if (error.code === 3) {
          errorMsg = 'Tiempo de espera agotado buscando señal GPS.';
        }
        setGpsError(errorMsg);
        if (!silent) {
          toast({
            title: "Error de GPS",
            description: errorMsg,
            variant: "destructive"
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Cache de 30s
      }
    );
  }, []);

  // Solicitar ubicación automáticamente al montar el componente
  useEffect(() => {
    requestGpsLocation(true);
  }, [requestGpsLocation]);

  // Mapa de distancias por conduce ID (en km)
  const distancesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!userLocation) return map;

    conduces.forEach(conduce => {
      const clientCoords = getConduceCoordinates(conduce, getClienteByNumero);
      if (clientCoords) {
        const dist = calculateDistanceKm(
          userLocation.lat,
          userLocation.lon,
          clientCoords.lat,
          clientCoords.lon
        );
        map.set(conduce.id, dist);
      }
    });

    return map;
  }, [conduces, userLocation, getClienteByNumero]);

  // Conduce más cercano
  const nearestClient = useMemo<NearestClientInfo | null>(() => {
    if (distancesMap.size === 0) return null;

    let minDistance = Infinity;
    let closestConduce: Conduce | null = null;

    conduces.forEach(conduce => {
      const dist = distancesMap.get(conduce.id);
      if (dist !== undefined && dist < minDistance) {
        minDistance = dist;
        closestConduce = conduce;
      }
    });

    if (closestConduce && minDistance !== Infinity) {
      return {
        conduce: closestConduce,
        distanceKm: minDistance,
        formattedDistance: formatDistance(minDistance)
      };
    }

    return null;
  }, [conduces, distancesMap]);

  // Total de conduces que tienen coordenadas GPS válidas
  const totalWithGps = useMemo(() => {
    return distancesMap.size;
  }, [distancesMap]);

  // Conduces ordenados según cercanía si sortByProximity está activo
  const sortedConduces = useMemo(() => {
    if (!sortByProximity || !userLocation || distancesMap.size === 0) {
      return conduces;
    }

    // Clonar arreglo para no mutar el original
    const result = [...conduces];

    result.sort((a, b) => {
      const distA = distancesMap.get(a.id);
      const distB = distancesMap.get(b.id);

      // Si ambos tienen distancia, el menor va primero
      if (distA !== undefined && distB !== undefined) {
        if (Math.abs(distA - distB) > 0.05) {
          return distA - distB;
        }
        // Si tienen casi la misma distancia (mismo cliente o cercanía), ordenar por cliente
        return (a.numeroCliente || '').localeCompare(b.numeroCliente || '');
      }

      // Si solo A tiene distancia, A va primero
      if (distA !== undefined && distB === undefined) {
        return -1;
      }

      // Si solo B tiene distancia, B va primero
      if (distA === undefined && distB !== undefined) {
        return 1;
      }

      // Si ninguno tiene distancia, mantener orden original
      return 0;
    });

    return result;
  }, [conduces, sortByProximity, userLocation, distancesMap]);

  return {
    userLocation,
    isLoadingGps,
    gpsError,
    requestGpsLocation,
    sortByProximity,
    setSortByProximity,
    distancesMap,
    nearestClient,
    totalWithGps,
    sortedConduces
  };
};
