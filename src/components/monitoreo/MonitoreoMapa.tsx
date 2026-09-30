import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  LocateFixed, 
  Truck, 
  Route as RouteIcon, 
  Layers,
  ExternalLink 
} from 'lucide-react';
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { getConduceCoordinates } from '@/utils/geo/distanceUtils';
import { getMapTileUrl } from '@/services/configService';
import { getTruckColor } from './truckColors';
import { TruckCurrentLocation, formatDeliveryDateTime } from './truckLocationUtils';
import { normalizeTruckCode } from '@/utils/trucksByRegion';
import { orderStopsForRoute, fetchExactStreetRoute } from './routePathUtils';

export interface StopPoint {
  key: string;
  lat: number;
  lon: number;
  numeroCliente: string;
  razonSocial: string;
  ciudad?: string;
  direccion?: string;
  encomendado: string;
  conduces: Conduce[];
  totalBultos: number;
  bultosEntregados: number;
  bultosPendientes: number;
  isFullyDelivered: boolean;
  hasPending: boolean;
  hasReturned: boolean;
  latestDeliveryTime?: string;
  latestDeliveryDate?: string;
}

interface MonitoreoMapaProps {
  conduces: Conduce[];
  getClienteByNumero: (numero: string) => Cliente | null | undefined;
  selectedTruck: string | null;
  statusFilter: 'todos' | 'pendientes' | 'entregados' | 'devueltos';
  focusTruckName?: string | null;
  truckLocations?: Map<string, TruckCurrentLocation>;
  onSelectTruck?: (truck: string | null) => void;
}

export const MonitoreoMapa: React.FC<MonitoreoMapaProps> = ({
  conduces,
  getClienteByNumero,
  selectedTruck,
  statusFilter,
  focusTruckName,
  truckLocations,
  onSelectTruck
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopsLayerRef = useRef<L.FeatureGroup | null>(null);
  const trucksLayerRef = useRef<L.FeatureGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeCasingPolylineRef = useRef<L.Polyline | null>(null);
  const routeAbortControllerRef = useRef<AbortController | null>(null);
  const truckMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTrucks, setShowTrucks] = useState(true);
  const [showPendingStops, setShowPendingStops] = useState(true);
  const [showDeliveredStops, setShowDeliveredStops] = useState(true);
  const [showRouteLines, setShowRouteLines] = useState(true);

  // 1. Agrupar conduces por parada de cliente
  const stopPoints = useMemo(() => {
    const stopsMap = new Map<string, StopPoint>();

    for (const c of conduces) {
      const truck = normalizeTruckCode(c.encomendado || '');

      if (selectedTruck && truck !== normalizeTruckCode(selectedTruck)) {
        continue;
      }

      if (statusFilter === 'pendientes' && c.estado !== 'En tránsito') {
        continue;
      }
      if (statusFilter === 'entregados' && c.estado !== 'Entregado') {
        continue;
      }
      if (statusFilter === 'devueltos' && c.estado !== 'Devuelto') {
        continue;
      }

      const coords = getConduceCoordinates(c, getClienteByNumero as any);
      if (!coords) continue;

      const client = getClienteByNumero ? getClienteByNumero(c.numeroCliente) : null;
      const clientNum = c.numeroCliente || client?.numero || '';
      const key = `${coords.lat.toFixed(5)}_${coords.lon.toFixed(5)}_${truck || 'sin-camion'}`;

      const existing = stopsMap.get(key);
      const isDelivered = c.estado === 'Entregado';
      const isReturned = c.estado === 'Devuelto';
      const isPending = c.estado === 'En tránsito';

      const bultos = Number(c.cantidadBultos) || 1;
      const deliveredCount = isDelivered ? (Number(c.cantidadEntregados) || bultos) : 0;
      const pendingCount = isPending ? bultos : 0;

      if (existing) {
        existing.conduces.push(c);
        if (!existing.numeroCliente && clientNum) {
          existing.numeroCliente = clientNum;
        }
        existing.totalBultos += bultos;
        existing.bultosEntregados += deliveredCount;
        existing.bultosPendientes += pendingCount;
        if (isPending) existing.hasPending = true;
        if (isReturned) existing.hasReturned = true;
        if (!isDelivered) existing.isFullyDelivered = false;
        if (isDelivered && (c.tiempoEntrega || c.horaEntregaExacta)) {
          const newTime = c.horaEntregaExacta || c.tiempoEntrega;
          if (!existing.latestDeliveryTime || (newTime && newTime > existing.latestDeliveryTime)) {
            existing.latestDeliveryTime = newTime;
            existing.latestDeliveryDate = c.fechaEntrega;
          }
        }
      } else {
        stopsMap.set(key, {
          key,
          lat: coords.lat,
          lon: coords.lon,
          numeroCliente: clientNum,
          razonSocial: c.razonSocial || client?.nombre || `Cliente #${clientNum}`,
          ciudad: c.ciudad || client?.ciudad,
          direccion: c.ubicacion || client?.direccion,
          encomendado: truck || 'Sin asignar',
          conduces: [c],
          totalBultos: bultos,
          bultosEntregados: deliveredCount,
          bultosPendientes: pendingCount,
          isFullyDelivered: isDelivered,
          hasPending: isPending,
          hasReturned: isReturned,
          latestDeliveryTime: isDelivered ? (c.horaEntregaExacta || c.tiempoEntrega) : undefined,
          latestDeliveryDate: isDelivered ? c.fechaEntrega : undefined
        });
      }
    }

    return Array.from(stopsMap.values());
  }, [conduces, getClienteByNumero, selectedTruck, statusFilter]);

  // 2. Inicializar mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [18.7357, -70.1627],
      zoom: 8,
      zoomControl: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    const isDark = document.documentElement.classList.contains('dark');
    const tileUrl = getMapTileUrl(isDark);

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap & TransporteRoyal'
    }).addTo(map);

    // Capa de paradas de clientes
    const stopsLayer = L.featureGroup().addTo(map);
    stopsLayerRef.current = stopsLayer;

    // Capa de camiones / encomendados
    const trucksLayer = L.featureGroup().addTo(map);
    trucksLayerRef.current = trucksLayer;

    mapInstanceRef.current = map;

    return () => {
      if (routeAbortControllerRef.current) {
        routeAbortControllerRef.current.abort();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Renderizar marcadores de Paradas (Clientes) y Camiones en el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stopsLayer = stopsLayerRef.current;
    const trucksLayer = trucksLayerRef.current;
    if (!map || !stopsLayer || !trucksLayer) return;

    stopsLayer.clearLayers();
    trucksLayer.clearLayers();
    truckMarkersMapRef.current.clear();

    if (routeAbortControllerRef.current) {
      routeAbortControllerRef.current.abort();
      routeAbortControllerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (routeCasingPolylineRef.current) {
      routeCasingPolylineRef.current.remove();
      routeCasingPolylineRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    // A. Renderizar Paradas de Clientes
    stopPoints.forEach((stop) => {
      const isDelivered = stop.isFullyDelivered;
      if (isDelivered && !showDeliveredStops) return;
      if (!isDelivered && !showPendingStops) return;

      const truckColor = getTruckColor(stop.encomendado);
      bounds.extend([stop.lat, stop.lon]);

      const markerHtml = isDelivered
        ? `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div style="background-color: #059669; border-color: #ffffff;" class="w-7 h-7 rounded-full border-2 shadow-md flex items-center justify-center text-white font-black text-xs transition-transform group-hover:scale-110">
              ✓
            </div>
            <span class="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[9px] font-bold px-1 rounded-full border border-white">
              ${stop.totalBultos}
            </span>
          </div>
        `
        : `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div style="background-color: ${truckColor.hex}; border-color: #ffffff;" class="w-8 h-8 rounded-full border-2 shadow-md flex items-center justify-center text-white font-black text-[10px] tracking-tight transition-transform group-hover:scale-110">
              ${stop.encomendado || 'R'}
            </div>
            <span class="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full border border-white shadow-xs">
              ${stop.bultosPendientes}
            </span>
          </div>
        `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-monitoreo-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const popupHtml = `
        <div class="p-1 min-w-[220px] max-w-[280px] font-sans">
          <div class="pb-1.5 mb-1.5 border-b border-slate-200">
            <div class="flex items-center justify-between gap-1.5">
              <span class="font-black text-xs text-slate-900 truncate">
                ${stop.razonSocial}
              </span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style="background-color: ${truckColor.hex};">
                ${stop.encomendado}
              </span>
            </div>
            ${stop.numeroCliente ? `
              <p class="text-[10px] font-medium text-slate-500 mt-0.5">
                Nº Cliente: <strong class="text-[#0A1F44] font-bold">#${stop.numeroCliente}</strong>
              </p>
            ` : ''}
          </div>
          <div class="text-[11px] text-slate-600 space-y-1">
            <p><strong>Ciudad:</strong> ${stop.ciudad || 'No especificada'}</p>
            ${stop.direccion ? `<p class="truncate"><strong>Dir:</strong> ${stop.direccion}</p>` : ''}
            <div class="flex items-center justify-between pt-1 text-xs">
              <span class="text-amber-700 font-bold">📦 Pendientes: ${stop.bultosPendientes}</span>
              <span class="text-emerald-700 font-bold">✅ Entregados: ${stop.bultosEntregados}</span>
            </div>
            ${stop.latestDeliveryTime ? `
              <div class="mt-1 pt-1 border-t border-slate-100 flex items-start gap-1 text-[11px] text-emerald-800 font-semibold">
                <span class="text-xs shrink-0">🕒</span>
                <span>Entregado: <strong class="text-emerald-950">${formatDeliveryDateTime(stop.latestDeliveryTime, stop.latestDeliveryDate)}</strong></span>
              </div>
            ` : ''}
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[10px] text-slate-400">Total: ${stop.totalBultos} bultos</span>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lon}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              Google Maps ↗
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([stop.lat, stop.lon], { icon: customIcon });
      marker.bindPopup(popupHtml);
      stopsLayer.addLayer(marker);
    });

    // B. Renderizar Ubicación Actual de los Camiones / Encomendados (🚚)
    if (showTrucks && truckLocations && truckLocations.size > 0) {
      truckLocations.forEach((loc, truckName) => {
        if (selectedTruck && normalizeTruckCode(truckName) !== normalizeTruckCode(selectedTruck)) return;

        bounds.extend([loc.lat, loc.lon]);
        const colors = getTruckColor(truckName);

        // Icono de camión prominente con radar animado con colores de la app
        const truckIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-2 rounded-full animate-ping opacity-75" style="background-color: ${colors.hex};"></div>
            <div class="relative w-10 h-10 rounded-full border-2 shadow-2xl flex items-center justify-center text-white text-base transition-transform group-hover:scale-115" style="background-color: #0A1F44; border-color: #F5B942;">
              🚚
            </div>
            <div class="absolute -bottom-2.5 px-1.5 py-0.5 rounded-md text-[10px] font-black shadow-md border whitespace-nowrap flex items-center gap-0.5" style="background-color: #0A1F44; color: #F5B942; border-color: #F5B942;">
              <span>${truckName}</span>
            </div>
          </div>
        `;

        const truckIcon = L.divIcon({
          html: truckIconHtml,
          className: 'custom-truck-live-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -22]
        });

        const statusLabel = loc.status === 'completado'
          ? '🏁 Ruta completada'
          : loc.status === 'en_entrega'
          ? '📦 En ruta de entregas'
          : '🏢 En base de operaciones';

        const truckPopupHtml = `
          <div class="p-1 min-w-[250px] max-w-[300px] font-sans">
            <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-royal-blue/20" style="background-color: #0A1F44; color: white; margin: -5px -5px 8px -5px; padding: 8px 10px; border-radius: 6px 6px 0 0;">
              <div>
                <span class="text-sm font-black text-royal-yellow flex items-center gap-1">
                  🚚 Camión ${loc.truckName}
                </span>
                ${loc.driverName ? `<p class="text-[11px] text-white/80 font-medium">Chofer: ${loc.driverName}</p>` : ''}
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                ${loc.percentEntregado}%
              </span>
            </div>
            
            <div class="text-xs space-y-1.5 text-slate-700">
              <div class="p-1.5 rounded bg-slate-50 border border-slate-200">
                <p class="text-[10px] font-bold text-slate-500 uppercase">📍 Ubicación Actual:</p>
                <p class="font-extrabold text-slate-900">
                  ${loc.lastStopName || 'En base central'}
                  ${loc.lastClientNumero ? `<span class="text-[10px] font-bold text-royal-blue ml-1">(#${loc.lastClientNumero})</span>` : ''}
                </p>
                ${loc.lastCity ? `<p class="text-[11px] text-slate-600">${loc.lastCity}</p>` : ''}
                ${loc.lastBultosCount !== undefined && loc.lastBultosCount > 0 ? `
                  <div class="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-emerald-800 font-semibold">
                    <span class="flex items-center gap-1">
                      <span>📦</span>
                      <span>Último entregado:</span>
                    </span>
                    <strong class="text-emerald-950">${loc.lastBultosCount} ${loc.lastBultosCount === 1 ? 'bulto' : 'bultos'}${loc.lastFactura ? ` (Fac: #${loc.lastFactura})` : ''}</strong>
                  </div>
                ` : ''}
                ${(loc.lastDateTime || loc.lastTime) ? `
                  <div class="mt-1 pt-1 border-t border-slate-200/60 flex items-start gap-1 text-[11px] text-emerald-800 font-semibold">
                    <span class="text-xs shrink-0">🕒</span>
                    <span>Hora entrega: <strong class="text-emerald-950">${loc.lastDateTime || loc.lastTime}</strong></span>
                  </div>
                ` : ''}
              </div>

              ${loc.nextStopName ? `
                <div class="p-1.5 rounded bg-amber-50/70 border border-amber-200/80">
                  <p class="text-[10px] font-bold text-amber-800 uppercase">🔜 Próxima parada estimada:</p>
                  <p class="font-bold text-amber-950">
                    ${loc.nextStopName}
                    ${loc.nextClientNumero ? `<span class="text-[10px] font-bold text-amber-800 ml-1">(#${loc.nextClientNumero})</span>` : ''}
                  </p>
                  ${loc.nextCity ? `<p class="text-[10px] text-amber-700">${loc.nextCity}</p>` : ''}
                </div>
              ` : ''}

              <div class="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                <div class="p-1 rounded bg-amber-100/50 text-amber-900 font-bold">
                  📦 Pendientes: ${loc.bultosPendientes}
                </div>
                <div class="p-1 rounded bg-emerald-100/50 text-emerald-900 font-bold">
                  ✅ Entregados: ${loc.bultosEntregados}
                </div>
              </div>
            </div>

            <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-medium">${statusLabel}</span>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-[10px] font-bold text-royal-blue hover:underline flex items-center gap-0.5"
              >
                Abrir GPS ↗
              </a>
            </div>
          </div>
        `;

        const truckMarker = L.marker([loc.lat, loc.lon], { 
          icon: truckIcon,
          zIndexOffset: 1000 // Elevar sobre las paradas
        });
        truckMarker.bindPopup(truckPopupHtml);
        trucksLayer.addLayer(truckMarker);
        truckMarkersMapRef.current.set(truckName, truckMarker);
      });
    }

    // C. Trazar Rutas Exactas por Calles y Carreteras para el camión seleccionado
    if (showRouteLines && selectedTruck && stopPoints.length > 0) {
      const normSelected = normalizeTruckCode(selectedTruck);
      const truckStops = stopPoints.filter(s => normalizeTruckCode(s.encomendado) === normSelected);
      if (truckStops.length > 0) {
        const truckLoc = truckLocations?.get(normSelected);
        const orderedWaypoints = orderStopsForRoute(truckStops, truckLoc);

        if (orderedWaypoints.length >= 2) {
          const abortCtrl = new AbortController();
          routeAbortControllerRef.current = abortCtrl;
          const truckColor = getTruckColor(normSelected);

          fetchExactStreetRoute(orderedWaypoints, abortCtrl.signal)
            .then((streetCoords) => {
              if (!streetCoords || streetCoords.length < 2) return;
              if (abortCtrl.signal.aborted) return;
              if (!mapInstanceRef.current) return;

              if (routePolylineRef.current) {
                routePolylineRef.current.remove();
              }
              if (routeCasingPolylineRef.current) {
                routeCasingPolylineRef.current.remove();
              }

              // Línea de base/borde estilo carretera vehicular (Royal Blue oscuro)
              const casing = L.polyline(streetCoords, {
                color: '#0A1F44',
                weight: 6,
                opacity: 0.7,
                lineJoin: 'round',
                lineCap: 'round'
              }).addTo(mapInstanceRef.current);

              // Trazado continuo exacto por calles con el color del camión
              const mainLine = L.polyline(streetCoords, {
                color: truckColor.hex || '#2563eb',
                weight: 4,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round'
              }).addTo(mapInstanceRef.current);

              routeCasingPolylineRef.current = casing;
              routePolylineRef.current = mainLine;
            })
            .catch((err) => {
              if (err.name !== 'AbortError') {
                console.warn('Error trazando ruta vehicular:', err);
              }
            });
        }
      }
    }

    // Ajustar zoom inicial si hay puntos y no se está enfocando uno específico
    if (bounds.isValid() && !focusTruckName) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [
    stopPoints, 
    truckLocations, 
    selectedTruck, 
    showTrucks, 
    showPendingStops, 
    showDeliveredStops, 
    showRouteLines, 
    focusTruckName
  ]);

  // 4. Manejar enfoque directo a un camión específico
  useEffect(() => {
    if (!focusTruckName || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const normFocus = normalizeTruckCode(focusTruckName);

    // Buscar si existe el marcador del camión
    const truckMarker = truckMarkersMapRef.current.get(normFocus);
    if (truckMarker) {
      const latLng = truckMarker.getLatLng();
      map.flyTo(latLng, 14, { duration: 1.2 });
      setTimeout(() => {
        truckMarker.openPopup();
      }, 1250);
      return;
    }

    // Si no hay marcador de camión pero hay paradas de ese camión
    const truckStops = stopPoints.filter(s => normalizeTruckCode(s.encomendado) === normFocus);
    if (truckStops.length > 0) {
      const bounds = L.latLngBounds(truckStops.map(s => [s.lat, s.lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [focusTruckName, stopPoints]);

  const handleCenterAll = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const allCoords: [number, number][] = [];

    stopPoints.forEach(s => allCoords.push([s.lat, s.lon]));
    truckLocations?.forEach(t => allCoords.push([t.lat, t.lon]));

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([18.7357, -70.1627], 8);
    }
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-md overflow-hidden relative bg-white dark:bg-slate-900 rounded-xl">
      {/* Barra de Controles y Capas sobre el Mapa */}
      <div className="p-2 sm:p-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-royal-yellow flex items-center gap-1 mr-1">
            <Layers className="h-4 w-4" /> Capas:
          </span>

          {/* Toggle Camiones */}
          <Button
            variant={showTrucks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTrucks(!showTrucks)}
            className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
              showTrucks ? 'bg-royal-yellow text-slate-950 hover:bg-amber-400' : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            🚚 Camiones ({truckLocations?.size || 0})
          </Button>

          {/* Toggle Bultos Pendientes */}
          <Button
            variant={showPendingStops ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPendingStops(!showPendingStops)}
            className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
              showPendingStops ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            📦 Por Entregar
          </Button>

          {/* Toggle Bultos Entregados */}
          <Button
            variant={showDeliveredStops ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDeliveredStops(!showDeliveredStops)}
            className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
              showDeliveredStops ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            ✅ Entregados
          </Button>

          {/* Toggle Rutas */}
          {selectedTruck && (
            <Button
              variant={showRouteLines ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRouteLines(!showRouteLines)}
              className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
                showRouteLines ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-white border-slate-700'
              }`}
            >
              <RouteIcon className="h-3 w-3 mr-1" /> Ruta {selectedTruck}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {selectedTruck && onSelectTruck && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectTruck(null)}
              className="h-7 px-2.5 text-[11px] bg-slate-800 text-royal-yellow border-royal-yellow/40 hover:bg-slate-700 font-bold"
            >
              Limpiar filtro ({selectedTruck})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCenterAll}
            className="h-7 px-2.5 text-[11px] bg-slate-800 text-white border-slate-700 hover:bg-slate-700 font-semibold"
            title="Centrar todo el mapa"
          >
            <LocateFixed className="h-3.5 w-3.5 mr-1 text-royal-yellow" />
            Centrar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 px-2 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[620px] lg:h-[calc(100vh-290px)] min-h-[500px] z-0" 
      />

      {/* Leyenda Flotante en la esquina inferior */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-royal-blue/20 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
        <div className="font-extrabold text-[10px] text-royal-blue dark:text-royal-yellow uppercase tracking-wider mb-1">
          Leyenda del Mapa
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-royal-blue border-2 border-royal-yellow text-white text-[10px] flex items-center justify-center font-bold">
            🚚
          </span>
          <span className="font-semibold">Ubicación actual del camión</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-600 border border-white text-white text-[9px] flex items-center justify-center font-black">
            R
          </span>
          <span>Bultos pendientes por entregar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white text-white text-[9px] flex items-center justify-center font-black">
            ✓
          </span>
          <span>Bultos entregados</span>
        </div>
      </div>
    </Card>
  );
};
