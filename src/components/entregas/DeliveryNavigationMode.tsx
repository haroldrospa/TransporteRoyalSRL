import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { ArrowLeft, Navigation, Package, CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Phone, FileText, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Conduce, getEntregasStorage } from '@/services/EntregasStorage';
import { MapChooserDialog } from './dialog/MapChooserDialog';
import { useData } from '@/contexts/DataContext';

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
  onClose: () => void;
  onDelivery: (conduce: Conduce) => void;
  initialLocation?: { lat: number; lon: number } | null;
}

export const DeliveryNavigationMode: React.FC<DeliveryNavigationModeProps> = ({
  route,
  onClose,
  onDelivery,
  initialLocation
}) => {
  const { getClienteByNumero } = useData();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastRoutedStopIndexRef = useRef<number>(-1);
  // Guard to prevent async callbacks from running after component unmounts
  const mountedRef = useRef(true);

  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; speed?: number; heading?: number } | null>(initialLocation || null);
  const [distanceText, setDistanceText] = useState<string>('Calculando...');
  const [etaText, setEtaText] = useState<string>('');
  const [durationText, setDurationText] = useState<string>('');
  const [isMapChooserOpen, setIsMapChooserOpen] = useState(false);
  const [showConduces, setShowConduces] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [routeHeading, setRouteHeading] = useState<number | null>(null);

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

  const currentStop = useMemo(() => route[currentStopIndex], [route, currentStopIndex]);
  const clientDetails = useMemo(() => currentStop ? getClienteByNumero(currentStop.numeroCliente) : null, [currentStop, getClienteByNumero]);
  const isFinished = currentStopIndex >= route.length;

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
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    map.on('dragstart', () => {
      setIsFollowing(false);
    });

    const isDark = document.documentElement.classList.contains('dark');
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    mapInstanceRef.current = map;

    // Use ResizeObserver to ensure the map always recalculates its size when the container changes
    // This perfectly solves the "blank map" issue when opening the portal or animating it.
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current) {
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

  useEffect(() => {
    if (!navigator.geolocation || isFinished) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
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
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
    setCurrentStopIndex(prev => Math.min(route.length, prev + 1));
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

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-royal-blue mb-2">¡Ruta Completada!</h2>
        <p className="text-muted-foreground mb-8 text-lg">Has visitado todas las paradas de la ruta optimizada.</p>
        <Button onClick={onClose} size="lg" className="bg-royal-blue hover:bg-royal-blue/90 text-white font-bold w-full max-w-sm rounded-xl h-14">
          Volver a Entregas
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden" translate="no">
      {/* Header flotante */}
      <div className="absolute top-0 left-0 w-full z-[1000] p-4 bg-gradient-to-b from-black/60 via-black/30 to-transparent flex items-center justify-between pointer-events-none">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-slate-700 hover:bg-white transition-colors pointer-events-auto"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-full shadow-lg flex items-center gap-3 font-bold text-royal-blue text-sm pointer-events-auto">
          <button 
            onClick={handlePrevStop} 
            disabled={currentStopIndex === 0}
            className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm"></span>
            Parada {currentStopIndex + 1} de {route.length}
          </div>

          <button 
            onClick={handleNextStop} 
            disabled={currentStopIndex >= route.length - 1}
            className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa (rotado por CSS) */}
      <div 
        ref={mapContainerRef} 
        className="absolute z-0 transition-transform duration-700 ease-out bg-muted/20" 
        style={{
          width: '200vmax',
          height: '200vmax',
          left: 'calc(50vw - 100vmax)',
          top: 'calc(70vh - 100vmax)',
          transform: `rotate(${isFollowing ? -currentHeading : 0}deg)`,
          transformOrigin: '50% 50%'
        }}
      />

      {/* Botón de Brújula / Recenter */}
      {!isFollowing && (
        <button 
          onClick={() => {
            setIsFollowing(true);
            if (mapInstanceRef.current && userLocation) {
              mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 18, { animate: true });
            }
          }}
          className="absolute bottom-32 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-royal-blue z-[2000] animate-in fade-in"
        >
          <LocateFixed className="h-6 w-6" />
        </button>
      )}

      {/* Panel Superior Flotante (Antes Inferior) */}
      <div className="absolute top-[72px] left-0 w-full z-[1000] p-4 pt-2 pointer-events-none">
        <div 
          className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden pointer-events-auto max-w-lg mx-auto flex flex-col max-h-[75vh]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          
          {/* Cabecera del Panel (Info del Destino y ETA) */}
          <div className="p-3 pb-2 border-b border-border/50 flex flex-col gap-2 relative">
            <div className="flex gap-3 items-center">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-foreground truncate leading-tight">
                  {currentStop?.razonSocial}
                </h3>
              </div>
              {clientDetails?.contacto && (
                <a 
                  href={`tel:${clientDetails.contacto.replace(/\D/g,'')}`}
                  className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow transition-colors shrink-0"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Lista de Conduces (Collapsible) */}
          <div 
            className="flex items-center justify-between px-3 py-1.5 bg-muted/10 cursor-pointer border-b border-border/30 hover:bg-muted/20 transition-colors"
            onClick={() => setShowConduces(!showConduces)}
          >
            <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> {currentStop?.totalBultos} bultos a entregar
            </h4>
            {showConduces ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          
          {showConduces && (
            <div className="overflow-y-auto p-3 py-2 space-y-2 bg-muted/10 flex-1 max-h-[30vh]">
              {currentStop?.conduces.map((conduce, idx) => (
                <div key={conduce.numeroConduce} className="bg-background border border-border/50 rounded-lg p-2 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs">#{conduce.numeroConduce}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5" /> {conduce.numeroFactura}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-royal-blue">{conduce.cantidadBultos}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Bultos</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="p-3 pt-2 grid grid-cols-2 gap-2 mt-auto bg-background rounded-b-3xl">
              <Button 
                variant="outline" 
                size="sm"
                className="h-10 rounded-lg font-bold border-2 text-xs hover:bg-muted"
                onClick={handleNextStop}
              >
                Siguiente <ChevronRight className="ml-0.5 h-4 w-4" />
              </Button>
              <Button 
                size="sm"
                className="h-10 rounded-lg font-black bg-royal-yellow hover:bg-yellow-500 text-royal-blue text-sm shadow hover:shadow-md transition-all"
                onClick={handleDeliver}
              >
                Entregar
              </Button>
            </div>
        </div>
      </div>

      {/* Panel Inferior Flotante (Tiempo, Distancia, ETA) */}
      <div className="absolute bottom-0 left-0 w-full z-[1000] p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none pb-8">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-4 pointer-events-auto max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-end gap-2 mb-0.5">
              <span className="text-3xl font-black text-royal-blue leading-none">{durationText ? durationText.replace(' min', '') : '--'}</span>
              <span className="text-lg font-bold text-muted-foreground leading-none mb-0.5">{durationText?.includes('h') ? '' : 'min'}</span>
            </div>
            <div className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
              {distanceText} <span className="w-1 h-1 rounded-full bg-border"></span> Llegada: {etaText || '--:--'}
            </div>
          </div>
          {isRouting ? (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Navigation className="h-6 w-6 animate-spin text-royal-blue opacity-50" />
            </div>
          ) : (
            <button 
              onClick={() => setIsMapChooserOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 pointer-events-auto"
            >
              <Navigation className="h-5 w-5 fill-white" />
              <span>Iniciar</span>
            </button>
          )}
        </div>
      </div>

      <MapChooserDialog
        open={isMapChooserOpen}
        onOpenChange={setIsMapChooserOpen}
        ubicacion={currentStop?.ubicacion}
        clienteNombre={currentStop?.razonSocial}
      />
    </div>
  );
};
