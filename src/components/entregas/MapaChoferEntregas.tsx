import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DeliveryNavigationMode } from './DeliveryNavigationMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Conduce } from '@/types/conduces';
import { encontrarProvinciaPorCiudad } from '@/constants/provinciasCiudades';
import { MapPin, AlertCircle, Info, Navigation, Package, Map as MapIcon, ExternalLink, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import L from 'leaflet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

interface MapaChoferEntregasProps {
  conduces: Conduce[];
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
}

interface GeoJsonFeature {
  type: string;
  properties: {
    shapeISO: string;
    shapeName: string;
    shapeID: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

export const MapaChoferEntregas: React.FC<MapaChoferEntregasProps> = ({ 
  conduces, 
  openGoogleMaps, 
  onDelivery, 
  onReturn 
}) => {
  const { getClienteByNumero } = useData();
  const { toast } = useToast();
  
  const [geojson, setGeojson] = useState<GeoJsonData | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [hoveredProvincia, setHoveredProvincia] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedProvDetail, setSelectedProvDetail] = useState<string | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any | null>(null);
  const [hoveredClient, setHoveredClient] = useState<any | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Estados de optimización de ruta
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeViewMode, setRouteViewMode] = useState<'provinces' | 'optimized'>('provinces');
  const [isNavigating, setIsNavigating] = useState(false);

  const polylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasSetInitialBounds = useRef(false);
  const lastViewMode = useRef(routeViewMode);
  // Tipo de mapa activo: 'streets' (Calles) o 'svg' (Provincias)
  const [mapType, setMapType] = useState<'streets' | 'svg'>('streets');
  
  const lastMapType = useRef(mapType);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Estado para minimizar/maximizar el mapa completo
  const [isMapMinimized, setIsMapMinimized] = useState(() => {
    return localStorage.getItem('mapa_chofer_minimized') === 'true';
  });

  // Helper to calculate distance between two coordinates in km (Haversine formula)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Heurística de Vecino Más Cercano (Nearest Neighbor TSP) para optimizar ruta
  const handleCreateRoute = () => {
    if (clientsWithCoordinates.length === 0) {
      toast({
        title: "Sin ubicaciones",
        description: "No hay clientes con coordenadas válidas para crear una ruta.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    toast({
      title: "Obteniendo ubicación",
      description: "Buscando tu ubicación GPS actual...",
    });

    if (!navigator.geolocation) {
      toast({
        title: "GPS no soportado",
        description: "Tu navegador no soporta geolocalización. Usando ubicación de referencia.",
        variant: "destructive"
      });
      // Fallback
      const fallbackLat = clientsWithCoordinates[0].lat;
      const fallbackLon = clientsWithCoordinates[0].lon;
      runRouteOptimization(fallbackLat, fallbackLon, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation({ lat, lon });
        runRouteOptimization(lat, lon, false);
      },
      (error) => {
        console.warn("Error obteniendo ubicación de GPS:", error);
        toast({
          title: "Ubicación de referencia",
          description: "No se pudo obtener tu GPS exacto. Usando ubicación del primer cliente.",
        });
        // Fallback al primer cliente
        const fallbackLat = clientsWithCoordinates[0].lat;
        const fallbackLon = clientsWithCoordinates[0].lon;
        setUserLocation({ lat: fallbackLat, lon: fallbackLon });
        runRouteOptimization(fallbackLat, fallbackLon, true);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const runRouteOptimization = (startLat: number, startLon: number, isFallback: boolean) => {
    let current = { lat: startLat, lon: startLon };
    const unvisited = [...clientsWithCoordinates];
    const routePoints: any[] = [];

    // Si es fallback (comienza en el primer cliente), ese cliente ya es visitado
    if (isFallback && unvisited.length > 0) {
      const startClient = unvisited[0];
      routePoints.push({
        ...startClient,
        distanceFromPrevious: 0
      });
      current = { lat: startClient.lat, lon: startClient.lon };
      unvisited.splice(0, 1);
    }

    while (unvisited.length > 0) {
      let closestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = getDistance(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = i;
        }
      }

      if (closestIndex !== -1) {
        const nextClient = unvisited[closestIndex];
        routePoints.push({
          ...nextClient,
          distanceFromPrevious: minDistance
        });
        current = { lat: nextClient.lat, lon: nextClient.lon };
        unvisited.splice(closestIndex, 1);
      } else {
        break;
      }
    }

    setOptimizedRoute(routePoints);
    setRouteViewMode('optimized');
    setIsOptimizing(false);

    toast({
      title: "Ruta optimizada creada",
      description: `Ruta generada con ${routePoints.length} paradas, ordenada de más cercana a más lejana.`,
    });
  };

  const getMultiStopMapsUrl = () => {
    if (optimizedRoute.length === 0) return '';
    
    // Si no tenemos ubicación real, usamos el primer cliente como origen
    const originStr = userLocation 
      ? `${userLocation.lat},${userLocation.lon}` 
      : `${optimizedRoute[0].lat},${optimizedRoute[0].lon}`;
      
    const lastClient = optimizedRoute[optimizedRoute.length - 1];
    const destinationStr = `${lastClient.lat},${lastClient.lon}`;
    
    // Todos los clientes intermedios son waypoints
    const intermediateClients = userLocation 
      ? optimizedRoute.slice(0, -1) 
      : optimizedRoute.slice(1, -1);
      
    if (intermediateClients.length === 0) {
      return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}`;
    }
    
    const waypoints = intermediateClients.map(c => `${c.lat},${c.lon}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}&waypoints=${encodeURIComponent(waypoints)}`;
  };

  // Estado para expandir/colapsar clientes individuales en el modal
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const toggleMapMinimize = () => {
    setIsMapMinimized(prev => {
      const newVal = !prev;
      localStorage.setItem('mapa_chofer_minimized', String(newVal));
      return newVal;
    });
  };

  // Normalizar nombres de provincias del mapa a nuestra lista
  const normalizarProvinciaMapa = (name: string): string => {
    if (!name) return "";
    const norm = name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quitar acentos
    
    if (norm === "el seybo" || norm === "seybo") return "El Seibo";
    if (norm === "la estrelleta" || norm === "estrelleta") return "Elías Piña";
    if (norm === "salcedo") return "Hermanas Mirabal";
    if (norm === "baoruco") return "Bahoruco";
    
    const listaProvincias = [
      "Distrito Nacional", "Azua", "Bahoruco", "Barahona", "Dajabón", "Duarte", 
      "El Seibo", "Elías Piña", "Espaillat", "Hato Mayor", "Hermanas Mirabal", 
      "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez", 
      "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia", 
      "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan", 
      "San Pedro de Macorís", "Sánchez Ramírez", "Santiago", "Santiago Rodríguez", 
      "Santo Domingo", "Valverde"
    ];

    const found = listaProvincias.find(p => {
      const pNorm = p.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm);
    });
    
    return found || name;
  };

  // Cargar el GeoJSON
  useEffect(() => {
    setLoadingMap(true);
    fetch('/mapa-rd-provincias.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el mapa');
        }
        return response.json();
      })
      .then(data => {
        setGeojson(data);
        setLoadingMap(false);
      })
      .catch(error => {
        console.error('Error cargando GeoJSON:', error);
        setLoadingMap(false);
      });
  }, []);

  // Agrupar conduces por provincia y cliente
  const statsPorProvincia = useMemo(() => {
    const stats: Record<string, {
      totalConduces: number;
      totalBultos: number;
      clientes: Record<string, {
        razonSocial: string;
        numeroCliente: string;
        ubicacion?: string;
        conduces: Conduce[];
        totalBultos: number;
      }>;
    }> = {};

    conduces.forEach(conduce => {
      const prov = encontrarProvinciaPorCiudad(conduce.ciudad || '') || 'Sin Provincia Específica';
      if (prov) {
        if (!stats[prov]) {
          stats[prov] = {
            totalConduces: 0,
            totalBultos: 0,
            clientes: {}
          };
        }

        const bultosVal = conduce.cantidadBultos || 0;
        stats[prov].totalConduces += 1;
        stats[prov].totalBultos += bultosVal;

        const cliKey = conduce.numeroCliente || conduce.razonSocial || 'desconocido';
        const clientCache = getClienteByNumero(conduce.numeroCliente);
        const resolvedUbicacion = clientCache?.ubicacion || conduce.ubicacion;

        if (!stats[prov].clientes[cliKey]) {
          stats[prov].clientes[cliKey] = {
            razonSocial: conduce.razonSocial || 'Cliente no identificado',
            numeroCliente: conduce.numeroCliente || '',
            ubicacion: resolvedUbicacion,
            conduces: [],
            totalBultos: 0
          };
        }

        stats[prov].clientes[cliKey].conduces.push(conduce);
        stats[prov].clientes[cliKey].totalBultos += bultosVal;
        
        if (!stats[prov].clientes[cliKey].ubicacion && resolvedUbicacion) {
          stats[prov].clientes[cliKey].ubicacion = resolvedUbicacion;
        }
      }
    });

    return stats;
  }, [conduces, getClienteByNumero]);

  // Lista ordenada de provincias activas
  const rankingProvincias = useMemo(() => {
    return Object.entries(statsPorProvincia)
      .map(([name, data]) => {
        const uniqueClientsCount = Object.keys(data.clientes).length;
        return { name, uniqueClientsCount, ...data };
      })
      .filter(p => p.totalConduces > 0)
      .sort((a, b) => b.totalBultos - a.totalBultos);
  }, [statsPorProvincia]);

  // Proyección SVG dinámica con Zoom Dinámico basado en las provincias con pedidos
  const projection = useMemo(() => {
    if (!geojson) return null;

    // Obtener nombres de provincias que tienen pedidos asignados
    const activeProvinces = Object.keys(statsPorProvincia).filter(
      prov => statsPorProvincia[prov].totalConduces > 0
    );

    // Si hay provincias activas, calculamos los límites de la proyección usando solo esas provincias
    const featuresToBbox = (activeProvinces.length > 0)
      ? geojson.features.filter(feature => {
          const nombreProvin = normalizarProvinciaMapa(feature.properties.shapeName);
          return activeProvinces.includes(nombreProvin);
        })
      : geojson.features;

    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    
    featuresToBbox.forEach(feature => {
      const coords = feature.geometry.coordinates;
      const processCoord = (lon: number, lat: number) => {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      };
      
      if (feature.geometry.type === "Polygon") {
        coords.forEach((ring: any) => ring.forEach((pt: any) => processCoord(pt[0], pt[1])));
      } else if (feature.geometry.type === "MultiPolygon") {
        coords.forEach((poly: any) => poly.forEach((ring: any) => ring.forEach((pt: any) => processCoord(pt[0], pt[1]))));
      }
    });

    // Si los límites son demasiado pequeños (ej: solo 1 o 2 provincias activas),
    // expandimos para que mantenga algo de contexto geográfico y no se distorsione.
    let lonRangeRaw = maxLon - minLon;
    let latRangeRaw = maxLat - minLat;
    const MIN_LON_RANGE = 1.3; // Rango mínimo aproximado de 140km
    const MIN_LAT_RANGE = 1.0; // Rango mínimo aproximado de 110km

    if (activeProvinces.length > 0) {
      if (lonRangeRaw < MIN_LON_RANGE) {
        const diff = MIN_LON_RANGE - lonRangeRaw;
        minLon -= diff / 2;
        maxLon += diff / 2;
      }
      if (latRangeRaw < MIN_LAT_RANGE) {
        const diff = MIN_LAT_RANGE - latRangeRaw;
        minLat -= diff / 2;
        maxLat += diff / 2;
      }
    }

    // Agregar un 12% de padding para que el contenido no quede pegado a los bordes del SVG
    const paddingFactor = 0.12;
    const lonPadding = (maxLon - minLon) * paddingFactor;
    const latPadding = (maxLat - minLat) * paddingFactor;

    const minLonAdjusted = minLon - lonPadding;
    const maxLonAdjusted = maxLon + lonPadding;
    const minLatAdjusted = minLat - latPadding;
    const maxLatAdjusted = maxLat + latPadding;

    const lonRange = maxLonAdjusted - minLonAdjusted;
    const latRange = maxLatAdjusted - minLatAdjusted;
    
    const latRad = (19 * Math.PI) / 180;
    const cosLat = Math.cos(latRad);
    const aspect = (lonRange * cosLat) / latRange;

    return { 
      minLon: minLonAdjusted, 
      lonRange, 
      minLat: minLatAdjusted, 
      latRange, 
      aspect 
    };
  }, [geojson, statsPorProvincia]);

  // Función para proyectar coordenadas de GPS a píxeles SVG
  const projectCoords = useCallback((lat: number, lon: number, width: number, height: number) => {
    if (!projection) return null;
    const { minLon, lonRange, minLat, latRange, aspect } = projection;
    
    const padding = 15;
    const mapWidth = width - padding * 2;
    const mapHeight = height - padding * 2;
    
    let w = mapWidth;
    let h = mapHeight;
    
    if (w / h > aspect) {
      w = h * aspect;
    } else {
      h = w / aspect;
    }
    
    const xOffset = padding + (mapWidth - w) / 2;
    const yOffset = padding + (mapHeight - h) / 2;

    const x = xOffset + ((lon - minLon) / lonRange) * w;
    const y = yOffset + (1 - (lat - minLat) / latRange) * h;
    
    return { x, y };
  }, [projection]);

  // Obtener todos los clientes activos con ubicaciones válidas
  const clientsWithCoordinates = useMemo(() => {
    const clientsMap = new Map<string, {
      numeroCliente: string;
      razonSocial: string;
      lat: number;
      lon: number;
      totalConduces: number;
      totalBultos: number;
      conduces: Conduce[];
    }>();

    conduces.forEach(conduce => {
      const clientCache = getClienteByNumero(conduce.numeroCliente);
      const ubicacionStr = clientCache?.ubicacion || conduce.ubicacion;

      if (ubicacionStr) {
        const parts = ubicacionStr.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lon = parseFloat(parts[1].trim());

          if (!isNaN(lat) && !isNaN(lon)) {
            const key = conduce.numeroCliente || conduce.razonSocial || 'desconocido';
            const bultosVal = conduce.cantidadBultos || 0;

            if (!clientsMap.has(key)) {
              clientsMap.set(key, {
                numeroCliente: conduce.numeroCliente || '',
                razonSocial: conduce.razonSocial || 'Cliente no identificado',
                lat,
                lon,
                totalConduces: 0,
                totalBultos: 0,
                conduces: []
              });
            }

            const clientData = clientsMap.get(key)!;
            clientData.totalConduces += 1;
            clientData.totalBultos += bultosVal;
            clientData.conduces.push(conduce);
          }
        }
      }
    });

    return Array.from(clientsMap.values());
  }, [conduces, getClienteByNumero]);

  // Clientes proyectados con coordenadas X e Y en el SVG
  const projectedClients = useMemo(() => {
    return clientsWithCoordinates.map(client => {
      const coords = projectCoords(client.lat, client.lon, 600, 400);
      if (!coords) return null;
      return {
        ...client,
        x: coords.x,
        y: coords.y
      };
    }).filter(Boolean) as Array<typeof clientsWithCoordinates[number] & { x: number; y: number }>;
  }, [clientsWithCoordinates, projectCoords]);

  // Resumen del viaje optimizado (Distancia, tiempo, combustible, costos)
  const tripSummary = useMemo(() => {
    if (optimizedRoute.length === 0) {
      return { totalDistance: 0, totalTimeMin: 0, totalTimeStr: '0 min', fuelGals: 0, fuelCost: 0 };
    }
    
    // Sumar distancias de todos los tramos
    const totalDistance = optimizedRoute.reduce((sum, client) => sum + (client.distanceFromPrevious || 0), 0);
    
    // Velocidad promedio urbana/interurbana estimada en Rep. Dom.: 45 km/h
    const avgSpeedKmh = 45;
    const travelTimeHours = totalDistance / avgSpeedKmh;
    const travelTimeMin = travelTimeHours * 60;
    
    // Tiempo de parada promedio por cliente para entrega física: 10 minutos
    const timePerStopMin = 10;
    const totalStopTimeMin = optimizedRoute.length * timePerStopMin;
    
    const totalTimeMin = travelTimeMin + totalStopTimeMin;
    
    let totalTimeStr = '';
    if (totalTimeMin < 60) {
      totalTimeStr = `${Math.round(totalTimeMin)} min`;
    } else {
      const hrs = Math.floor(totalTimeMin / 60);
      const mins = Math.round(totalTimeMin % 60);
      totalTimeStr = `${hrs}h ${mins}m`;
    }
    
    // Consumo promedio de combustible: 28 km por galón (típico de camión ligero/camioneta de reparto)
    const kmPerGallon = 28;
    const fuelGals = totalDistance / kmPerGallon;
    
    // Precio promedio del galón de Gasoil Óptimo / Gasolina en Rep. Dom.: RD$ 272.00
    const pricePerGallonRD = 272;
    const fuelCost = Math.round(fuelGals * pricePerGallonRD);
    
    return {
      totalDistance,
      totalTimeMin,
      totalTimeStr,
      fuelGals,
      fuelCost
    };
  }, [optimizedRoute]);

  const getPathData = (geometry: any, width: number, height: number) => {
    if (!projection) return "";
    const { minLon, lonRange, minLat, latRange, aspect } = projection;
    
    const padding = 15;
    const mapWidth = width - padding * 2;
    const mapHeight = height - padding * 2;
    
    let w = mapWidth;
    let h = mapHeight;
    
    if (w / h > aspect) {
      w = h * aspect;
    } else {
      h = w / aspect;
    }
    
    const xOffset = padding + (mapWidth - w) / 2;
    const yOffset = padding + (mapHeight - h) / 2;

    const project = (lon: number, lat: number) => {
      const x = xOffset + ((lon - minLon) / lonRange) * w;
      const y = yOffset + (1 - (lat - minLat) / latRange) * h;
      return [x, y];
    };

    const { type, coordinates } = geometry;
    
    if (type === "Polygon") {
      return coordinates.map((ring: any) => {
        return "M" + ring.map((pt: any) => {
          const [x, y] = project(pt[0], pt[1]);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" L") + " Z";
      }).join(" ");
    } else if (type === "MultiPolygon") {
      return coordinates.map((poly: any) => {
        return poly.map((ring: any) => {
          return "M" + ring.map((pt: any) => {
            const [x, y] = project(pt[0], pt[1]);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" L") + " Z";
        }).join(" ");
      }).join(" ");
    }
    return "";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mapContainerRef.current) {
      const bounds = mapContainerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - bounds.left + 15,
        y: e.clientY - bounds.top + 15,
      });
    }
  };

  const hoveredData = useMemo(() => {
    if (!hoveredProvincia) return null;
    return statsPorProvincia[hoveredProvincia] || {
      totalConduces: 0,
      totalBultos: 0,
      clientes: {}
    };
  }, [hoveredProvincia, statsPorProvincia]);

  const selectedProvData = useMemo(() => {
    if (!selectedProvDetail) return null;
    return statsPorProvincia[selectedProvDetail] || {
      totalConduces: 0,
      totalBultos: 0,
      clientes: {}
    };
  }, [selectedProvDetail, statsPorProvincia]);

  // Lista de clientes ordenada para la provincia seleccionada
  const clientesList = useMemo(() => {
    if (!selectedProvData) return [];
    return Object.values(selectedProvData.clientes).sort((a, b) => b.totalBultos - a.totalBultos);
  }, [selectedProvData]);

  // Expandir todos los clientes por defecto cuando se abre el modal de la provincia
  useEffect(() => {
    if (selectedProvDetail && selectedProvData) {
      const initialExpanded: Record<string, boolean> = {};
      Object.keys(selectedProvData.clientes).forEach(key => {
        initialExpanded[key] = true;
      });
      setExpandedClients(initialExpanded);
    }
  }, [selectedProvDetail, selectedProvData]);

  const toggleClientExpand = (key: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 1. Inicializar y renderizar la base del mapa Leaflet (una sola vez)
  useEffect(() => {
    if (mapType !== 'streets' || loadingMap) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const container = document.getElementById('leaflet-map');
    if (!container || mapInstanceRef.current) return;

    // Centro de República Dominicana por defecto
    const centerLat = 18.7357;
    const centerLon = -70.1627;
    const initialZoom = 8;

    const map = L.map('leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      tap: false
    }).setView([centerLat, centerLon], initialZoom);
    
    mapInstanceRef.current = map;

    const isDark = () => document.documentElement.classList.contains('dark');
    
    const getTileUrl = () => isDark()
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    // Capa de calles premium (CartoDB Positron / Dark Matter)
    const tileLayer = L.tileLayer(getTileUrl(), {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    // Escuchar cambios de tema (oscuro/claro) para actualizar las calles al vuelo
    const themeObserver = new MutationObserver(() => {
      tileLayer.setUrl(getTileUrl());
    });
    
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Ajustar dimensiones del mapa asíncronamente para evitar desalineación de Leaflet
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(resizeTimer);
      themeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapType, loadingMap]);

  // 2. Renderizar y actualizar marcadores en el mapa Leaflet de forma dinámica (previene race conditions)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapType !== 'streets') return;

    // Limpiar marcadores antiguos de forma segura
    let cleanupRoute = () => {};

    markersRef.current.forEach(m => {
      try {
        m.remove();
      } catch (e) {
        console.warn("Error al remover marcador de Leaflet:", e);
      }
    });
    markersRef.current = [];

    // Limpiar polilíneas y marcador de usuario anteriores
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const clientsWithCoords = projectedClients.filter(c => c.lat && c.lon);
    if (clientsWithCoords.length === 0) return;

    // Agregar marcadores como farmacias miniaturas (con opción de número de secuencia de ruta)
    const newMarkers = clientsWithCoords.map(client => {
      const routeIndex = optimizedRoute.findIndex(r => r.numeroCliente === client.numeroCliente);
      const isRouteActive = routeViewMode === 'optimized' && routeIndex !== -1;
      
      const badgeHtml = isRouteActive ? `
        <div style="
          position: absolute;
          top: -6px;
          right: -6px;
          background-color: #2563eb;
          color: white;
          font-size: 10px;
          font-weight: bold;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          z-index: 10;
        ">
          ${routeIndex + 1}
        </div>
      ` : '';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          jus          <!-- Aura pulsante azul detrás de la casita -->
          <div class="animate-ping" style="
            background-color: rgba(245, 166, 35, 0.4);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 6px;
            transform: scale(1.8);
            pointer-events: none;
            animation-duration: 3s;
          "></div>
          <!-- Pin de Mapa SVG azul con edificios -->
          <svg viewBox="0 0 24 24" width="36" height="36" style="
            filter: drop-shadow(0px 2px 5px rgba(0,0,0,0.45));
            overflow: visible;
          ">
            <!-- Forma del Pin -->
            <path d="M 12 3 C 8.134 3 5 6.134 5 10 c 0 5.25 7 13 7 13 s 7 -7.75 7 -13 c 0 -3.866 -3.134 -7 -7 -7 z" fill="#0a2240" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
            <!-- Edificio Izquierdo -->
            <rect x="9" y="10.5" width="2.5" height="4.5" fill="#ffffff" />
            <!-- Edificio Derecho -->
            <rect x="12" y="7" width="3" height="8" fill="#ffffff" />
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 34]
      });

      const marker = L.marker([client.lat, client.lon], { icon: customIcon }).addTo(map);
      
      const tooltipContent = `
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px; line-height: 1.4;">
          <strong style="color: #0a2240; display: block; font-size: 12px; margin-bottom: 2px;">${client.razonSocial}</strong>
          ${isRouteActive ? `<span style="color: #2563eb; font-weight: bold;">Parada nº ${routeIndex + 1} de la ruta</span><br/>` : ''}
          <strong>Conduces:</strong> ${client.totalConduces}<br/>
          <strong style="color: #0a2240;">Bultos:</strong> ${client.totalBultos} bulto(s)
        </div>
      `;
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -5],
        opacity: 0.95
      });

      marker.on('click', () => {
        setSelectedClientDetail(client);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Dibujar la ubicación actual del usuario y la polilínea de ruta
    if (routeViewMode === 'optimized' && userLocation) {
      // 1. Marcador de ubicación del usuario
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div class="animate-ping" style="
            background-color: rgba(37, 99, 235, 0.4);
            width: 100%;
            height: 100%;
            border-radius: 50%;
            position: absolute;
          "></div>
          <div style="
            background-color: #2563eb;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
          "></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindTooltip("Mi Ubicación Actual");

      // 2. Línea de ruta real usando OSRM API (o fallback a línea recta)
      let isSubscribed = true;
      const points = [
        {lat: userLocation.lat, lon: userLocation.lon},
        ...optimizedRoute.map(c => ({lat: c.lat, lon: c.lon}))
      ];

      const fetchRealRoute = async () => {
        try {
          const coordsString = points.map(p => `${p.lon},${p.lat}`).join(';');
          const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
          
          if (!response.ok) throw new Error("OSRM API falló");
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0 && isSubscribed) {
            const routeCoords = data.routes[0].geometry.coordinates.map((coord: any[]) => [coord[1], coord[0]]);
            
            if (polylineRef.current) {
              polylineRef.current.remove();
            }
            
            polylineRef.current = L.polyline(routeCoords, {
              color: '#2563eb',
              weight: 5,
              opacity: 0.9,
              lineJoin: 'round'
            }).addTo(map);
          }
        } catch (error) {
          console.error("No se pudo cargar la ruta real, usando línea recta:", error);
          if (!isSubscribed) return;
          
          if (polylineRef.current) {
            polylineRef.current.remove();
          }
          
          const latlngs = points.map(p => [p.lat, p.lon] as [number, number]);
          polylineRef.current = L.polyline(latlngs, {
            color: '#2563eb',
            weight: 4.5,
            opacity: 0.8,
            dashArray: '8, 8',
            lineJoin: 'round'
          }).addTo(map);
        }
      };

      fetchRealRoute();

      // Limpieza local en caso de desmontaje rápido
      cleanupRoute = () => {
        isSubscribed = false;
      };

      // Ajustar límites de visualización incluyendo la ubicación del usuario
      const modeChanged = lastViewMode.current !== routeViewMode || lastMapType.current !== mapType;
      lastViewMode.current = routeViewMode;
      lastMapType.current = mapType;
      
      if (!hasSetInitialBounds.current || modeChanged) {
        try {
          const bounds = L.latLngBounds([
            [userLocation.lat, userLocation.lon],
            ...clientsWithCoords.map(c => [c.lat, c.lon])
          ]);
          map.fitBounds(bounds, { padding: [40, 40], animate: true });
          hasSetInitialBounds.current = true;
        } catch (e) {
          console.warn("Error al ajustar encuadre del mapa con ruta:", e);
        }
      }
    } else {
      // Ajustar límites estándar
      const modeChanged = lastViewMode.current !== routeViewMode || lastMapType.current !== mapType;
      lastViewMode.current = routeViewMode;
      lastMapType.current = mapType;
      
      if (!hasSetInitialBounds.current || modeChanged) {
        try {
          if (clientsWithCoords.length === 1) {
            map.setView([clientsWithCoords[0].lat, clientsWithCoords[0].lon], 13, { animate: false });
          } else if (clientsWithCoords.length > 1) {
            const bounds = L.latLngBounds(clientsWithCoords.map(c => [c.lat, c.lon]));
            map.fitBounds(bounds, { padding: [30, 30], animate: false });
          }
          hasSetInitialBounds.current = true;
        } catch (e) {
          console.warn("Error al ajustar encuadre del mapa estándar:", e);
        }
      }
    }

    return () => {
      cleanupRoute();
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [projectedClients, mapType, routeViewMode, userLocation, optimizedRoute]);

  return (
    <Card className="w-full border-border/40 shadow-sm mb-6 transition-all duration-300">
      <CardHeader className="pb-2 border-b border-border/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-royal-blue dark:text-white">
                <MapIcon className="h-5 w-5 text-blue-500" />
                Mapa de Entregas Pendientes
              </CardTitle>
              <CardDescription className="text-xs hidden md:block">
                Toca o haz clic sobre una provincia activa para ver los clientes y abrir su ubicación geográfica.
              </CardDescription>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMapMinimize}
              className="sm:hidden text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              title={isMapMinimized ? "Maximizar Mapa" : "Minimizar Mapa"}
            >
              {isMapMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
            {/* Selector de tipo de mapa */}
            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50/80">
              <Button
                variant={mapType === 'streets' ? 'default' : 'ghost'}
                size="sm"
                className={`text-[11px] h-7 px-3 rounded-md font-bold transition-all duration-150 ${mapType === 'streets' ? 'bg-royal-blue text-white hover:bg-royal-blue/90 shadow-sm' : 'text-slate-500 hover:text-royal-blue hover:bg-slate-100'}`}
                onClick={() => setMapType('streets')}
              >
                <MapIcon className={`h-3.5 w-3.5 mr-1 ${mapType === 'streets' ? 'text-royal-yellow' : ''}`} />
                Mapa de Calles
              </Button>
              <Button
                variant={mapType === 'svg' ? 'default' : 'ghost'}
                size="sm"
                className={`text-[11px] h-7 px-3 rounded-md font-bold transition-all duration-150 ${mapType === 'svg' ? 'bg-royal-blue text-white hover:bg-royal-blue/90 shadow-sm' : 'text-slate-500 hover:text-royal-blue hover:bg-slate-100'}`}
                onClick={() => setMapType('svg')}
              >
                <MapPin className={`h-3.5 w-3.5 mr-1 ${mapType === 'svg' ? 'text-royal-yellow' : ''}`} />
                Provincias
              </Button>
            </div>

            <div className="hidden md:flex items-center gap-3 text-xs font-medium text-muted-foreground mr-1">
              {mapType === 'svg' ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500/85 border border-blue-600 block"></span>
                    Con Pedidos ({rankingProvincias.length})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-royal-light dark:bg-muted/10 border border-border block"></span>
                    Sin Pedidos
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0a2240] border border-white block animate-pulse"></span>
                  Clientes con entregas ({projectedClients.length})
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMapMinimize}
              className="hidden sm:flex text-xs h-8 px-2 items-center gap-1.5 text-muted-foreground hover:text-foreground border border-border/40 hover:bg-muted"
            >
              {isMapMinimized ? (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Maximizar</span>
                </>
              ) : (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Minimizar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMapMinimized && (
        <CardContent className="pt-4">
          {loadingMap ? (
            <div className="h-[350px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm">Cargando mapa interactivo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Contenedor del Mapa */}
              <div 
                ref={mapContainerRef}
                className="lg:col-span-3 relative h-[320px] sm:h-[380px] bg-royal-light dark:bg-muted/10 rounded-xl border border-border/50 overflow-hidden flex items-center justify-center cursor-default select-none touch-none"
                onMouseMove={handleMouseMove}
              >
                {mapType === 'svg' ? (
                  <>
                    <svg 
                      className="w-full h-full p-2"
                      viewBox="0 0 600 400"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {geojson?.features.map((feature, idx) => {
                        const nombreProvin = normalizarProvinciaMapa(feature.properties.shapeName);
                        const data = statsPorProvincia[nombreProvin];
                        const hasPedidos = !!data && data.totalConduces > 0;
                        
                        let fill = "rgba(229, 231, 235, 0.15)"; 
                        let stroke = "rgba(107, 114, 128, 0.3)"; 
                        let strokeWidth = "1";
                        
                        if (hasPedidos) {
                          const maxBultos = Math.max(...rankingProvincias.map(p => p.totalBultos), 1);
                          const ratio = data.totalBultos / maxBultos;
                          const opacity = 0.45 + ratio * 0.45;
                          fill = `rgba(59, 130, 246, ${opacity})`; 
                          stroke = "#2563eb"; 
                          strokeWidth = hoveredProvincia === nombreProvin ? "2" : "1.2";
                        } else if (hoveredProvincia === nombreProvin) {
                          fill = "rgba(156, 163, 175, 0.25)";
                          stroke = "rgba(107, 114, 128, 0.6)";
                        }

                        if (hoveredProvincia === nombreProvin) {
                          strokeWidth = "2.5";
                          if (hasPedidos) {
                            stroke = "#1d4ed8"; 
                          } else {
                            stroke = "rgba(59, 130, 246, 0.8)"; 
                          }
                        }

                        return (
                          <path
                            key={feature.properties.shapeID || idx}
                            d={getPathData(feature.geometry, 600, 400)}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            className="transition-all duration-200 ease-in-out cursor-pointer"
                            onMouseEnter={() => {
                              if (!hoveredClient) {
                                setHoveredProvincia(nombreProvin);
                              }
                            }}
                            onMouseLeave={() => setHoveredProvincia(null)}
                            onClick={() => {
                              if (data && data.totalConduces > 0) {
                                setSelectedProvDetail(nombreProvin);
                              }
                            }}
                          />
                        );
                      })}

                      {/* Línea de ruta en el mapa SVG */}
                      {routeViewMode === 'optimized' && optimizedRoute.length > 0 && (() => {
                        const userSvgCoords = userLocation ? projectCoords(userLocation.lat, userLocation.lon, 600, 400) : null;
                        const points: string[] = [];
                        
                        if (userSvgCoords) {
                          points.push(`${userSvgCoords.x.toFixed(1)},${userSvgCoords.y.toFixed(1)}`);
                        }
                        
                        optimizedRoute.forEach(client => {
                          const coords = projectCoords(client.lat, client.lon, 600, 400);
                          if (coords) {
                            points.push(`${coords.x.toFixed(1)},${coords.y.toFixed(1)}`);
                          }
                        });
                        
                        return points.length > 1 ? (
                          <>
                            <polyline
                              points={points.join(" ")}
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="3.5"
                              strokeDasharray="6, 6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ opacity: 0.8 }}
                            />
                            {userSvgCoords && (
                              <g transform={`translate(${userSvgCoords.x}, ${userSvgCoords.y})`}>
                                <circle r="6" fill="#2563eb" stroke="white" strokeWidth="1.5" />
                                <circle 
                                  r="12" 
                                  fill="none" 
                                  stroke="#2563eb" 
                                  strokeWidth="1.5" 
                                  className="animate-ping" 
                                  style={{ opacity: 0.4, animationDuration: '3s' }} 
                                />
                              </g>
                            )}
                          </>
                        ) : null;
                      })()}

                      {/* Puntos de clientes ubicados en el mapa (Farmacias miniaturas SVG) */}
                      {projectedClients.map((client) => {
                        const routeIndex = optimizedRoute.findIndex(r => r.numeroCliente === client.numeroCliente);
                        const isRouteActive = routeViewMode === 'optimized' && routeIndex !== -1;
                        
                        return (
                          <g 
                            key={client.numeroCliente} 
                            className="cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientDetail(client);
                            }}
                            onMouseEnter={(e) => {
                              setHoveredProvincia(null);
                              setHoveredClient(client);
                            }}
                            onMouseLeave={() => setHoveredClient(null)}
                          >
                            {/* Aura pulsante royal-yellow */}
                            <circle 
                              cx={client.x} 
                              cy={client.y - 13} 
                              r="15" 
                              className="animate-ping fill-[#f5a623]/30"
                              style={{ animationDuration: '3s' }}
                            />
                            {/* Pin de Mapa en SVG */}
                            <g 
                              transform={`translate(${client.x - 12}, ${client.y - 23})`}
                              style={{ filter: 'drop-shadow(0px 1.5px 3px rgba(0,0,0,0.4))' }}
                            >
                              {/* Forma del Pin */}
                              <path 
                                d="M 12 3 C 8.134 3 5 6.134 5 10 c 0 5.25 7 13 7 13 s 7 -7.75 7 -13 c 0 -3.866 -3.134 -7 -7 -7 z" 
                                className="fill-[#0a2240] stroke-white dark:stroke-slate-900 transition-colors"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                              />
                              {/* Edificio Izquierdo */}
                              <rect x="9" y="10.5" width="2.5" height="4.5" fill="white" />
                              {/* Edificio Derecho */}
                              <rect x="12" y="7" width="3" height="8" fill="white" />
                            </g>
                            {/* Número de secuencia de ruta */}
                            {isRouteActive && (
                              <g transform={`translate(${client.x + 10}, ${client.y - 18})`}>
                                <circle r="8" fill="#2563eb" stroke="white" strokeWidth="1.2" />
                                <text 
                                  textAnchor="middle" 
                                  dy="3" 
                                  fill="white" 
                                  fontSize="9" 
                                  fontWeight="bold"
                                  fontFamily="sans-serif"
                                >
                                  {routeIndex + 1}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip flotante */}
                    {hoveredProvincia && hoveredData && (
                      <div 
                        className="absolute z-50 pointer-events-none bg-popover text-popover-foreground rounded-lg border border-border p-3 shadow-xl min-w-[200px] animate-scale-in text-xs"
                        style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                      >
                        <p className="font-bold text-sm text-royal-blue dark:text-white border-b pb-1 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          {hoveredProvincia}
                        </p>
                        {hoveredData.totalConduces > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-foreground font-semibold">
                              <span>Clientes:</span>
                              <span>{Object.keys(hoveredData.clientes).length}</span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>Conduces:</span>
                              <span className="font-bold">{hoveredData.totalConduces}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 font-bold pt-1 border-t mt-1">
                              <span>Total Bultos:</span>
                              <span>{hoveredData.totalBultos} bultos</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground pt-1.5 italic text-center border-t mt-1.5">
                              Haz clic para ver clientes
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-muted-foreground">
                            <div className="flex items-center gap-1.5 text-muted-foreground/80">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Sin entregas hoy</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {hoveredClient && (
                      <div 
                        className="absolute z-50 pointer-events-none bg-popover text-popover-foreground rounded-lg border border-border p-3 shadow-xl min-w-[200px] animate-scale-in text-xs"
                        style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                      >
                        <p className="font-bold text-sm text-royal-blue dark:text-white border-b pb-1 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-royal-yellow animate-pulse" />
                          {hoveredClient.razonSocial}
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-foreground font-semibold">
                            <span>Conduces:</span>
                            <span>{hoveredClient.totalConduces}</span>
                          </div>
                          <div className="flex justify-between items-center text-royal-blue dark:text-blue-400 font-bold pt-1 border-t mt-1">
                            <span>Bultos a Entregar:</span>
                            <span>{hoveredClient.totalBultos} bultos</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground pt-1.5 italic text-center border-t mt-1.5">
                            Toca para abrir detalles y navegar
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div id="leaflet-map" className="w-full h-full z-10" />
                )}
              </div>

              {/* Panel Lateral - Ruta de Entregas */}
              <div className="flex flex-col h-[320px] sm:h-[380px] border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
                <div className="bg-white border-b border-border/50 p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-royal-blue rounded-lg shadow-sm">
                        <MapPin className="h-4 w-4 text-royal-yellow animate-pulse" />
                      </div>
                      <span className="text-xs font-bold tracking-wider uppercase text-royal-blue">
                        Ruta de Entregas
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-royal-blue text-white text-[10px] font-bold px-2 py-0.5 border border-royal-blue">
                      {routeViewMode === 'provinces' ? `${rankingProvincias.length} Prov.` : `${optimizedRoute.length} Paradas`}
                    </Badge>
                  </div>
                  
                  {/* Selector de pestañas */}
                  <div className="flex bg-slate-100/80 rounded-lg p-1 border border-slate-200">
                    <button
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${
                        routeViewMode === 'provinces' 
                          ? 'bg-white text-royal-blue shadow-sm border border-slate-200/60' 
                          : 'text-slate-500 hover:text-royal-blue'
                      }`}
                      onClick={() => setRouteViewMode('provinces')}
                    >
                      Provincias
                    </button>
                    <button
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 ${
                        routeViewMode === 'optimized' 
                          ? 'bg-white text-royal-blue shadow-sm border border-slate-200/60' 
                          : 'text-slate-500 hover:text-royal-blue'
                      }`}
                      onClick={() => {
                        if (optimizedRoute.length > 0) {
                          setRouteViewMode('optimized');
                        } else {
                          handleCreateRoute();
                        }
                      }}
                    >
                      <span>Ruta Optimizada</span>
                      {optimizedRoute.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-royal-yellow"></span>
                      )}
                    </button>
                  </div>
                </div>

                {routeViewMode === 'provinces' ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-hide">
                      {rankingProvincias.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground text-xs gap-2">
                          <Info className="h-5 w-5 text-muted-foreground/60" />
                          <span>No tienes pedidos pendientes de entrega asignados</span>
                        </div>
                      ) : (
                        rankingProvincias.map((prov, index) => (
                          <div 
                            key={prov.name} 
                            className={`p-3 transition-colors hover:bg-muted/40 cursor-pointer flex items-center justify-between text-xs ${selectedProvDetail === prov.name ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => setSelectedProvDetail(prov.name)}
                            onMouseEnter={() => setHoveredProvincia(prov.name)}
                            onMouseLeave={() => setHoveredProvincia(null)}
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{index + 1}. {prov.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {prov.uniqueClientsCount} cliente{prov.uniqueClientsCount !== 1 ? 's' : ''} • {prov.totalConduces} cond.
                              </p>
                            </div>
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 font-bold shrink-0">
                              {prov.totalBultos} bultos
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                    {rankingProvincias.length > 0 && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-border/50">
                        <Button 
                          onClick={handleCreateRoute}
                          disabled={isOptimizing || clientsWithCoordinates.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Navigation className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                          {isOptimizing ? 'Optimizando...' : 'Crear Ruta Optimizada'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Resumen Métricas del Viaje */}
                    {optimizedRoute.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-2 border-b border-border/40 grid grid-cols-2 gap-1.5 shrink-0">
                        <div className="bg-card border border-border/20 rounded p-1.5 flex flex-col gap-0.5 shadow-sm">
                          <span className="text-[9px] text-muted-foreground font-semibold leading-none">Distancia Total</span>
                          <span className="font-bold text-foreground text-xs font-mono">{tripSummary.totalDistance.toFixed(1)} km</span>
                        </div>
                        <div className="bg-card border border-border/20 rounded p-1.5 flex flex-col gap-0.5 shadow-sm">
                          <span className="text-[9px] text-muted-foreground font-semibold leading-none">Tiempo Estimado</span>
                          <span className="font-bold text-foreground text-xs font-mono">{tripSummary.totalTimeStr}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-hide">
                      {optimizedRoute.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground text-xs gap-2">
                          <Info className="h-5 w-5 text-muted-foreground/60" />
                          <span>Haz clic en "Crear Ruta Optimizada" para iniciar</span>
                        </div>
                      ) : (
                        optimizedRoute.map((client, index) => (
                          <div 
                            key={client.numeroCliente} 
                            className={`p-3 transition-colors hover:bg-muted/40 cursor-pointer flex items-center justify-between text-xs ${selectedClientDetail?.numeroCliente === client.numeroCliente ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => setSelectedClientDetail(client)}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-foreground truncate">
                                {index + 1}. {client.razonSocial}
                              </p>
                              <p className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-1.5">
                                <span>{client.totalConduces} cond. • {client.totalBultos} bultos</span>
                                {index > 0 ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
                                    (+{client.distanceFromPrevious.toFixed(1)} km)
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                                    (Inicio: {client.distanceFromPrevious.toFixed(1)} km)
                                  </span>
                                )}
                              </p>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-100 font-bold shrink-0 text-[10px]">
                              Paso {index + 1}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                    {optimizedRoute.length > 0 && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-border/50 flex flex-col gap-1.5">
                        <Button 
                          onClick={() => setIsNavigating(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] h-8.5 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Iniciar Navegación
                        </Button>
                        <Button 
                          asChild
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8.5 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <a href={getMultiStopMapsUrl() || '#'} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Abrir Ruta en Google Maps
                          </a>
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => {
                            setRouteViewMode('provinces');
                            setOptimizedRoute([]);
                            setUserLocation(null);
                            if (polylineRef.current) {
                              polylineRef.current.remove();
                              polylineRef.current = null;
                            }
                            if (userMarkerRef.current) {
                              userMarkerRef.current.remove();
                              userMarkerRef.current = null;
                            }
                          }}
                          className="w-full text-[10px] h-7 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        >
                          Limpiar Ruta
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}

      {/* Modal para ver los clientes a entregar */}
      <Dialog 
        open={!!selectedProvDetail} 
        onOpenChange={(open) => {
          if (!open) setSelectedProvDetail(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-royal-blue dark:text-white">
              <MapPin className="h-5 w-5 text-blue-500 animate-bounce" />
              Clientes por Entregar en {selectedProvDetail}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecciona un cliente para ver o colapsar sus conduces y abrir su navegación.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {clientesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No hay clientes por entregar en esta provincia.
              </div>
            ) : (
              clientesList.map((cliente) => {
                const hasLocation = !!cliente.ubicacion;
                const clientKey = cliente.numeroCliente || cliente.razonSocial;
                const isExpanded = expandedClients[clientKey] !== false; // true por defecto
                
                return (
                  <div 
                    key={clientKey} 
                    className="p-3.5 border rounded-lg hover:border-blue-300 transition-colors bg-card/50 flex flex-col gap-3"
                  >
                    {/* Fila superior: Info del Cliente e Icono de Mapa */}
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 cursor-pointer select-none"
                      onClick={() => toggleClientExpand(clientKey)}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-bold text-foreground text-sm truncate">
                            {cliente.razonSocial}
                          </span>
                          {cliente.numeroCliente && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal text-muted-foreground">
                              ID: {cliente.numeroCliente}
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            {cliente.totalBultos} bulto{cliente.totalBultos !== 1 ? 's' : ''} ({cliente.conduces.length} cond.)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            Ciudad: {cliente.conduces?.[0]?.ciudad}
                          </span>
                        </div>
                      </div>

                      {/* Botón de Navegar o aviso de Sin ubicación */}
                      <div className="shrink-0 flex items-center justify-end sm:justify-start" onClick={(e) => e.stopPropagation()}>
                        {hasLocation ? (
                          <Button 
                            onClick={() => openGoogleMaps(cliente.ubicacion, cliente.razonSocial)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1.5 h-8.5 rounded-md px-3.5 shadow-sm"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Navegar
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Button>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50 text-[10px] py-1 font-semibold flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            Sin ubicación
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Lista de Conduces Pendientes por Entregar (Maximizado/Minimizado) */}
                    {isExpanded && (
                      <div className="space-y-2 mt-1 animate-scale-in">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conduces por entregar:</p>
                        <div className="space-y-1.5">
                          {cliente.conduces.map((conduce) => (
                            <div 
                              key={conduce.id || conduce.numeroConduce} 
                              className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border/30 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground">{conduce.numeroConduce}</span>
                                  {conduce.laboratorio && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 flex items-center">
                                      {conduce.laboratorio}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium">
                                  {conduce.cantidadBultos} bulto{conduce.cantidadBultos !== 1 ? 's' : ''}
                                  {conduce.factura && ` • Fac: ${conduce.factura}`}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <Button 
                                  onClick={() => {
                                    setSelectedProvDetail(null);
                                    onDelivery(conduce);
                                  }}
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-[10px] h-7 px-2 rounded-md"
                                >
                                  Entregar
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setSelectedProvDetail(null);
                                    onReturn(conduce);
                                  }}
                                  size="sm"
                                  variant="destructive"
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] h-7 px-2 rounded-md"
                                >
                                  Devolver
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para detalles de cliente desde el Mapa */}
      <Dialog 
        open={!!selectedClientDetail} 
        onOpenChange={(open) => {
          if (!open) setSelectedClientDetail(null);
        }}
      >
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-royal-blue dark:text-white">
              <MapPin className="h-5 w-5 text-rose-500 animate-bounce" />
              {selectedClientDetail?.razonSocial}
            </DialogTitle>
            <DialogDescription className="text-xs">
              ID Cliente: {selectedClientDetail?.numeroCliente}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Conduces</p>
                <p className="text-lg font-bold text-royal-blue dark:text-blue-400">{selectedClientDetail?.totalConduces}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bultos</p>
                <p className="text-lg font-bold text-royal-blue dark:text-blue-400">{selectedClientDetail?.totalBultos}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Conduces Asignados:</p>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                {selectedClientDetail?.conduces?.map((conduce: any) => (
                  <div key={conduce.id} className="flex justify-between items-center bg-white dark:bg-slate-950 p-2.5 rounded border border-border/60 text-xs">
                    <div>
                      <p className="font-bold text-foreground">Cond. {conduce.numeroConduce}</p>
                      <p className="text-[10px] text-muted-foreground">Lab: {conduce.laboratorio}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{conduce.cantidadBultos} bultos</p>
                      <p className="text-[10px] text-amber-600 font-medium">{conduce.estado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedClientDetail(null)}
            >
              Cerrar
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              onClick={() => {
                const clientCache = getClienteByNumero(selectedClientDetail?.numeroCliente || '');
                const resolvedUbicacion = clientCache?.ubicacion || selectedClientDetail?.conduces?.[0]?.ubicacion;
                openGoogleMaps(resolvedUbicacion, selectedClientDetail?.razonSocial);
                setSelectedClientDetail(null);
              }}
            >
              <Navigation className="h-4 w-4" />
              Navegar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isNavigating && createPortal(
        <DeliveryNavigationMode
          route={optimizedRoute}
          initialLocation={userLocation}
          onClose={() => setIsNavigating(false)}
          onDelivery={onDelivery}
        />,
        document.body
      )}
    </Card>
  );
};

export default MapaChoferEntregas;
