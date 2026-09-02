import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { ArrowLeft, Navigation, Package, CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Phone, FileText, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Conduce } from '@/types/conduces';
import { useData } from '@/contexts/DataContext';
import { getMapTileUrl } from '@/services/configService';

interface RoutePoint {
  numeroCliente: string;
  razonSocial: string;
  lat: number;
  lon: number;
  conduces: Conduce[];
  totalBultos: number;
}

interface DeliveryNavigationModeProps {
  route: RoutePoint[];
  onClose: (finished?: boolean) => void;
  onDelivery: (conduce: Conduce) => void;
  onReturn?: (conduce: Conduce) => void;
  initialLocation?: { lat: number; lon: number } | null;
}

export const DeliveryNavigationMode: React.FC<DeliveryNavigationModeProps> = ({
  route,
  onClose,
  onDelivery,
  onReturn,
  initialLocation
}) => {
  const { getClienteByNumero, conduces: allConduces = [] } = useData();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastRoutedStopIndexRef = useRef<number>(-1);
  // Guard to prevent async callbacks from running after component unmounts
  const mountedRef = useRef(true);

  const [currentStopIndex, setCurrentStopIndex] = useState(() => {
    const saved = localStorage.getItem('nav_current_stop');
    const parsed = saved ? parseInt(saved, 10) : 0;
    if (route && route.length > 0 && (parsed >= route.length || isNaN(parsed) || parsed < 0)) {
      return Math.max(0, route.length - 1);
    }
    return Math.max(0, isNaN(parsed) ? 0 : parsed);
  });

  // Asegurar que el índice nunca exceda los límites de la ruta
  useEffect(() => {
    if (route && route.length > 0 && currentStopIndex >= route.length) {
      setCurrentStopIndex(Math.max(0, route.length - 1));
    }
  }, [route, currentStopIndex]);

  useEffect(() => {
    localStorage.setItem('nav_current_stop', currentStopIndex.toString());
  }, [currentStopIndex]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; speed?: number; heading?: number } | null>(initialLocation || null);
  const [distanceText, setDistanceText] = useState<string>('Calculando...');
  const [etaText, setEtaText] = useState<string>('');
  const [durationText, setDurationText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [showConduces, setShowConduces] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [routeHeading, setRouteHeading] = useState<number | null>(null);
  const [isCardCollapsed, setIsCardCollapsed] = useState(false);

  // Inject keyframe animation styles once for Leaflet icons (Leaflet is outside React/Tailwind DOM)
  useEffect(() => {
    const styleId = 'leaflet-icon-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes nav-ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(2); opacity: 0; } }
        .nav-ping { animation: nav-ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Índice seguro para la parada actual
  const safeIndex = route && route.length > 0 ? Math.min(Math.max(0, currentStopIndex), route.length - 1) : 0;
  const currentStop = useMemo(() => route[safeIndex], [route, safeIndex]);
  const clientDetails = useMemo(() => currentStop ? getClienteByNumero(currentStop.numeroCliente) : null, [currentStop, getClienteByNumero]);

  // Verificar si TODOS los bultos/conduces de la ruta han sido efectivamente entregados o devueltos
  const allBultosDelivered = useMemo(() => {
    if (!route || route.length === 0) return false;
    const allConduceNumeros = route.flatMap(stop => (stop.conduces || []).map(c => c.numeroConduce));
    if (allConduceNumeros.length === 0) return false;

    return allConduceNumeros.every(num => {
      const live = allConduces.find(c => c.numeroConduce === num);
      return live?.estado === 'entregado' || live?.estado === 'devuelto';
    });
  }, [route, allConduces]);

  // Solo se considera terminada la ruta si se entregaron TODOS los bultos reales
  const isFinished = route.length > 0 && allBultosDelivered;

  // Calcula el ángulo de rotación del mapa para que siempre apunte hacia adelante ("derecho")
  const currentHeading = useMemo(() => {
    // Si vamos conduciendo, usar la brújula del GPS
    if (userLocation?.speed && userLocation.speed > 1.5 && userLocation.heading != null) {
      return userLocation.heading;
    }
    // Si tenemos la dirección exacta de la carretera (desde OSRM)
    if (routeHeading !== null) {
      return routeHeading;
    }
    // Fallback: usar la dirección en línea recta hacia la parada actual
    if (userLocation && currentStop) {
      const toRad = Math.PI / 180;
      const toDeg = 180 / Math.PI;
      const lat1 = userLocation.lat * toRad;
      const lat2 = currentStop.lat * toRad;
      const dLon = (currentStop.lon - userLocation.lon) * toRad;
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      return (Math.atan2(y, x) * toDeg + 360) % 360;
    }
    return 0;
  }, [userLocation, currentStop]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || isFinished) return;

    // IMPORTANT: Leaflet REQUIRES center+zoom at creation time.
    // Without them, adding a tile layer causes "infinite number of tiles" error.
    const initialCenter: L.LatLngExpression = initialLocation
      ? [initialLocation.lat, initialLocation.lon]
      : (route[0] ? [route[0].lat, route[0].lon] : [10.48, -66.87]);

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      tap: false,
      bounceAtZoomLimits: false,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    const stopFollowing = () => {
      setIsFollowing(false);
    };

    map.on('dragstart zoomstart', stopFollowing);
    map.on('movestart', (e: any) => {
      if (e.originalEvent) {
        stopFollowing();
      }
    });

    const isDark = document.documentElement.classList.contains('dark');
    const tileUrl = getMapTileUrl(isDark);

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    mapInstanceRef.current = map;

    // Use ResizeObserver to ensure the map always recalculates its size when the container changes
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      mapContainerRef.current.addEventListener('touchstart', stopFollowing, { passive: true });
      mapContainerRef.current.addEventListener('pointerdown', stopFollowing, { passive: true });

      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Backup timeout just in case
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      mountedRef.current = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      // CRITICAL: Reset ALL marker refs so they are recreated fresh on remount
      if (routePolylineRef.current) {
        try { routePolylineRef.current.remove(); } catch (_) { /* map already gone */ }
        routePolylineRef.current = null;
      }
      if (destMarkerRef.current) {
        try { destMarkerRef.current.remove(); } catch (_) { /* map already gone */ }
        destMarkerRef.current = null;
      }
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch (_) { /* map already gone */ }
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (_) { /* already removed */ }
        mapInstanceRef.current = null;
      }
    };
  }, [isFinished]);

  const fetchRoute = async (start: { lat: number; lon: number }, end: { lat: number; lon: number }) => {
    try {
      setIsRouting(true);
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      
      // Guard: component may have unmounted while fetch was in-flight
      if (!mountedRef.current || !mapInstanceRef.current) return;
      
      const data = await response.json();

      if (!mountedRef.current || !mapInstanceRef.current) return;

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        
        const distanceKm = routeData.distance / 1000;
        if (distanceKm < 1) {
          setDistanceText(`${(routeData.distance).toFixed(0)} m`);
        } else {
          setDistanceText(`${distanceKm.toFixed(2)} km`);
        }

        const durationSecs = routeData.duration;
        const durationMins = Math.ceil(durationSecs / 60);
        
        if (durationMins < 60) {
          setDurationText(`${durationMins} min`);
        } else {
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          setDurationText(`${hours}h ${mins}m`);
        }

        const arrivalTime = new Date(Date.now() + durationSecs * 1000);
        setEtaText(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        const coordinates = routeData.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        
        // Calculate the exact heading of the road from the first two points
        if (coordinates.length > 1) {
          const toRad = Math.PI / 180;
          const toDeg = 180 / Math.PI;
          const lat1 = coordinates[0][0] * toRad;
          const lon1 = coordinates[0][1] * toRad;
          const lat2 = coordinates[1][0] * toRad;
          const lon2 = coordinates[1][1] * toRad;
          const dLon = lon2 - lon1;
          const y = Math.sin(dLon) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
          const bearing = (Math.atan2(y, x) * toDeg + 360) % 360;
          setRouteHeading(bearing);
        }

        if (routePolylineRef.current) {
          try { routePolylineRef.current.remove(); } catch (_) { /* map already gone */ }
          routePolylineRef.current = null;
        }

        if (mountedRef.current && mapInstanceRef.current) {
          routePolylineRef.current = L.polyline(coordinates, {
            color: '#f5a623',
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round'
          }).addTo(mapInstanceRef.current);
        }
      }
    } catch (error) {
      console.error("Error obteniendo ruta OSRM:", error);
    } finally {
      if (mountedRef.current) setIsRouting(false);
    }
  };

  // Helper de distancia para throttling de GPS
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const lastGpsUpdateRef = useRef<{ lat: number; lon: number; heading: number; time: number }>({
    lat: 0,
    lon: 0,
    heading: 0,
    time: 0
  });

  useEffect(() => {
    if (!navigator.geolocation || isFinished) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const now = Date.now();
        const prev = lastGpsUpdateRef.current;
        
        // Throttling inteligente: evitar re-renderizados continuos a menos que haya movimiento real
        const distKm = getDistanceKm(prev.lat, prev.lon, latitude, longitude);
        const headingDiff = Math.abs((heading || 0) - prev.heading);
        const timeDiff = now - prev.time;

        if (prev.time > 0 && distKm < 0.003 && headingDiff < 8 && timeDiff < 1000) {
          return; // Pequeño jitter de GPS sin movimiento real, ignorar para fluidez a 60fps
        }

        lastGpsUpdateRef.current = {
          lat: latitude,
          lon: longitude,
          heading: heading || 0,
          time: now
        };

        setUserLocation({ 
          lat: latitude, 
          lon: longitude, 
          speed: speed || 0, 
          heading: heading || 0 
        });
      },
      (error) => {
        console.error("Error tracking location:", error);
        if (!userLocation && route.length > 0) {
          setUserLocation({ lat: route[0].lat, lon: route[0].lon });
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 1000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isFinished]);

  useEffect(() => {
    if (!userLocation && currentStop && !isFinished) {
      const timer = setTimeout(() => {
        if (!userLocation) {
          setUserLocation({ lat: currentStop.lat - 0.015, lon: currentStop.lon - 0.015 });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userLocation, currentStop, isFinished]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentStop || isFinished) return;

    if (!destMarkerRef.current) {
      const destIcon = L.divIcon({
        className: '',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center;">
            <div class="nav-ping" style="background-color: rgba(245,166,35,0.45); width: 28px; height: 28px; border-radius: 50%; position: absolute;"></div>
            <svg viewBox="0 0 24 24" width="44" height="44" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.5)); overflow: visible; position: relative; z-index:10;">
              <path d="M 12 2 C 7.6 2 4 5.6 4 10 c 0 6 8 14 8 14 s 8 -8 8 -14 c 0 -4.4 -3.6 -8 -8 -8 z" fill="#0a2240" stroke="#ffffff" stroke-width="1.5" />
              <rect x="9" y="10.5" width="2.5" height="4.5" fill="#ffffff" />
              <rect x="12" y="7" width="3" height="8" fill="#ffffff" />
            </svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44]
      });
      destMarkerRef.current = L.marker([currentStop.lat, currentStop.lon], { icon: destIcon }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng([currentStop.lat, currentStop.lon]);
    }

    // 2. User Location Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: '',
        html: `
          <div style="position: relative; width: 52px; height: 52px; display: flex; justify-content: center; align-items: center;">
            <div class="nav-ping" style="background-color: rgba(37,99,235,0.35); width: 52px; height: 52px; border-radius: 50%; position: absolute;"></div>
            <div style="background-color: white; border-radius: 50%; width: 38px; height: 38px; box-shadow: 0 3px 10px rgba(0,0,0,0.35); position: relative; z-index: 10; border: 3px solid #2563eb; display: flex; align-items: center; justify-content: center; transform: rotate(${currentHeading}deg); transition: transform 0.5s ease-out;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </div>
          </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon }).addTo(map);
      } else {
        userMarkerRef.current.setIcon(userIcon);
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
      }

      // Update route and bounds IF the stop changed or if it's the very first time
      if (lastRoutedStopIndexRef.current !== currentStopIndex) {
        fetchRoute(userLocation, currentStop);
        lastRoutedStopIndexRef.current = currentStopIndex;
        
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            // Iniciar directamente con la vista cercana (zoom 18) en la ubicación del camión
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 18, { animate: true });
          }
        }, 300);
      } else if (userMarkerRef.current && isFollowing) {
        // On normal updates (user moved, stop didn't change): keep truck centered IF following
        if (map) {
          let currentZoom = map.getZoom() ?? 16;
          // If driving (speed > ~7 km/h), auto-zoom in closely to the road like Waze
          if (userLocation.speed && userLocation.speed > 2) {
            currentZoom = 18;
          }
          map.setView([userLocation.lat, userLocation.lon], currentZoom, { animate: true });
        }
      }
    }
  }, [currentStop, currentStopIndex, userLocation, isFinished]);

  const handleNextStop = () => {
    if (route.length === 0) return;
    setCurrentStopIndex(prev => Math.min(Math.max(0, route.length - 1), prev + 1));
  };

  const handlePrevStop = () => {
    setCurrentStopIndex(prev => Math.max(0, prev - 1));
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentStopIndex < route.length - 1) {
      handleNextStop();
    } else if (distance < -50 && currentStopIndex > 0) {
      handlePrevStop();
    }
    setTouchStart(null);
  };

  const handleDeliver = () => {
    if (currentStop && currentStop.conduces.length > 0) {
      // Pasamos el primer conduce para que abra el modal.
      onDelivery(currentStop.conduces[0]);
    }
  };

  const handleReturn = () => {
    if (currentStop && currentStop.conduces.length > 0 && onReturn) {
      onReturn(currentStop.conduces[0]);
    }
  };

  useEffect(() => {
    if (!route || route.length === 0) {
      onClose(false);
    }
  }, [route, onClose]);

  if (!route || route.length === 0) {
    return null;
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-royal-blue mb-2">¡Ruta Completada!</h2>
        <p className="text-muted-foreground mb-8 text-lg">Has visitado todas las paradas de la ruta optimizada.</p>
        <Button onClick={() => onClose(true)} size="lg" className="bg-royal-blue hover:bg-royal-blue/90 text-white font-bold w-full max-w-sm rounded-xl h-14">
          Cerrar Ruta Oficialmente
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden" translate="no">
      {/* Contenedor del Mapa a pantalla completa (100% nativo, ultra fluido) */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 w-full h-full z-0 bg-slate-100 dark:bg-slate-900" 
      />

      {/* Botón Flotante para Re-centrar en el camión */}
      {!isFollowing && (
        <button 
          onClick={() => {
            setIsFollowing(true);
            if (mapInstanceRef.current && userLocation) {
              mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 17, { animate: true });
            }
          }}
          className="absolute bottom-20 right-4 h-11 px-4 bg-royal-blue text-white rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs z-[1500] animate-in fade-in transition-all active:scale-95 border-2 border-white pointer-events-auto"
        >
          <LocateFixed className="h-4 w-4 text-royal-yellow" />
          <span>Centrar</span>
        </button>
      )}

      {/* Panel Superior Compacto Unificado (Diseño minimalista y moderno) */}
      <div className="absolute top-2 left-0 w-full z-[1000] px-3 pointer-events-none">
        <div 
          className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border border-border/70 p-3 max-w-md mx-auto pointer-events-auto transition-all duration-200"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Fila 1: Botón Volver + Píldora de Parada + Teléfono + Toggle Minimizar */}
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={() => onClose(false)}
              className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted text-foreground flex items-center justify-center transition-colors shrink-0 shadow-sm"
              title="Pausar y salir al mapa general"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Píldora de Parada con controles previos y siguientes */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-royal-blue bg-blue-50/90 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/50">
              <button 
                onClick={handlePrevStop} 
                disabled={currentStopIndex === 0}
                className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-25 transition-colors"
                title="Parada anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="whitespace-nowrap text-[11px]">Parada {currentStopIndex + 1} de {route.length}</span>
              <button 
                onClick={handleNextStop} 
                disabled={currentStopIndex >= route.length - 1}
                className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-25 transition-colors"
                title="Siguiente parada"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {clientDetails?.contacto && (
                <a 
                  href={`tel:${clientDetails.contacto.replace(/\D/g,'')}`}
                  className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-sm transition-colors"
                  title="Llamar al cliente"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={() => setIsCardCollapsed(!isCardCollapsed)}
                className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors"
                title={isCardCollapsed ? "Expandir detalles" : "Minimizar"}
              >
                {isCardCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Fila 2: Nombre del Cliente + Bultos */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-foreground truncate leading-tight">
                {currentStop?.razonSocial}
              </h3>
              {clientDetails?.direccion && !isCardCollapsed && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  📍 {clientDetails.direccion}
                </p>
              )}
            </div>

            {/* Contador de bultos con opción a desplegar conduces */}
            <button
              onClick={() => setShowConduces(!showConduces)}
              className="flex items-center gap-1 text-[11px] font-bold bg-muted/80 hover:bg-muted text-foreground px-2.5 py-1 rounded-lg transition-colors shrink-0"
              title="Ver conduces y facturas"
            >
              <Package className="h-3.5 w-3.5 text-royal-blue" />
              <span>{currentStop?.totalBultos} bulto{currentStop?.totalBultos !== 1 ? 's' : ''}</span>
              {showConduces ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Desplegable de conduces si se expande */}
          {showConduces && !isCardCollapsed && (
            <div className="overflow-y-auto mt-2 pt-2 border-t border-border/40 space-y-1.5 max-h-[22vh]">
              {currentStop?.conduces.map((conduce, idx) => (
                <div key={conduce.numeroConduce} className="bg-muted/40 rounded-lg p-1.5 px-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-royal-blue/10 text-royal-blue font-black flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold">#{conduce.numeroConduce}</span>
                    <span className="text-[10px] text-muted-foreground">({conduce.numeroFactura})</span>
                  </div>
                  <span className="font-black text-royal-blue">{conduce.cantidadBultos} bulto{conduce.cantidadBultos !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fila 3: Botones de Acción (diseño táctil de baja altura) */}
          {!isCardCollapsed && (
            <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-border/40">
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 rounded-xl font-bold border text-xs text-foreground hover:bg-muted shadow-sm"
                onClick={handleNextStop}
                disabled={currentStopIndex >= route.length - 1}
              >
                Siguiente <ChevronRight className="ml-0.5 h-3 w-3" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                className="h-9 rounded-xl font-bold border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs shadow-sm transition-colors"
                onClick={handleReturn}
              >
                Devolución
              </Button>
              <Button 
                size="sm"
                className="h-9 rounded-xl font-black bg-royal-yellow hover:bg-yellow-400 text-royal-blue text-xs shadow-md transition-transform active:scale-95"
                onClick={handleDeliver}
              >
                Entregar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Barra Inferior Flotante Compacta (Tiempo, Distancia y ETA) */}
      <div className="absolute bottom-3 left-0 w-full z-[1000] px-3 pointer-events-none pb-safe">
        <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border border-border/70 py-2 px-3.5 pointer-events-auto max-w-md mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg font-black text-royal-blue leading-none">
              {durationText ? durationText.replace(' min', '') : '--'}
              <span className="text-[11px] font-bold text-muted-foreground ml-0.5">{durationText?.includes('h') ? '' : 'min'}</span>
            </span>
            <span className="h-3.5 w-px bg-border"></span>
            <div className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 truncate">
              <span>{distanceText}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/60"></span>
              <span>Llegada: {etaText || '--:--'}</span>
            </div>
          </div>

          {/* Si el panel superior está minimizado, mostrar botón rápido de Entregar */}
          {isCardCollapsed && (
            <Button 
              size="sm"
              className="h-8 px-3.5 rounded-lg font-black bg-royal-yellow hover:bg-yellow-400 text-royal-blue text-xs shadow-sm shrink-0"
              onClick={handleDeliver}
            >
              Entregar
            </Button>
          )}

          {isRouting && (
            <Navigation className="h-4 w-4 animate-spin text-royal-blue opacity-70 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};
