import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Conduce } from '@/types/conduces';
import { encontrarProvinciaPorCiudad } from '@/constants/provinciasCiudades';
import { MapPin, CheckCircle2, Package, Eye, AlertCircle, Info, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MapaEntregasRDProps {
  conduces: Conduce[];
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

export const MapaEntregasRD: React.FC<MapaEntregasRDProps> = ({ conduces }) => {
  const [geojson, setGeojson] = useState<GeoJsonData | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [hoveredProvincia, setHoveredProvincia] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedProvDetail, setSelectedProvDetail] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Normalizar nombres de provincias del mapa a nuestra lista
  const normalizarProvinciaMapa = (name: string): string => {
    if (!name) return "";
    const norm = name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quitar acentos
    
    if (norm === "el seybo" || norm === "seybo") return "El Seibo";
    if (norm === "la estrelleta" || norm === "estrelleta") return "Elías Piña";
    if (norm === "salcedo") return "Hermanas Mirabal";
    if (norm === "baoruco") return "Bahoruco";
    
    // Lista de provincias oficial
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

  // Cargar el GeoJSON simplificado
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

  // Calcular las estadísticas por provincia filtrando únicamente los bultos entregados
  const statsPorProvincia = useMemo(() => {
    const stats: Record<string, {
      totalConduces: number;
      totalBultos: number;
      conducesLista: Conduce[];
    }> = {};
    
    conduces.forEach(conduce => {
      // Filtrar para que solo procese 'Entregado'
      if (conduce.estado !== 'Entregado') return;

      const prov = encontrarProvinciaPorCiudad(conduce.ciudad || '');
      if (prov) {
        if (!stats[prov]) {
          stats[prov] = {
            totalConduces: 0,
            totalBultos: 0,
            conducesLista: []
          };
        }
        
        const bultosVal = conduce.cantidadBultos || 0;
        stats[prov].totalConduces += 1;
        stats[prov].totalBultos += bultosVal;
        stats[prov].conducesLista.push(conduce);
      }
    });
    
    return stats;
  }, [conduces]);

  // Lista ordenada de provincias por entregas de bultos para el panel lateral
  const rankingProvincias = useMemo(() => {
    return Object.entries(statsPorProvincia)
      .map(([name, data]) => ({ name, ...data }))
      .filter(p => p.totalBultos > 0)
      .sort((a, b) => b.totalBultos - a.totalBultos);
  }, [statsPorProvincia]);

  // Calcular la proyección SVG dinámica basada en la bounding box del GeoJSON
  const projection = useMemo(() => {
    if (!geojson) return null;

    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    
    geojson.features.forEach(feature => {
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

    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    
    // Factor de deformación de Mercator en RD (latitud ~19 grados)
    const latRad = (19 * Math.PI) / 180;
    const cosLat = Math.cos(latRad);
    const aspect = (lonRange * cosLat) / latRange;

    return {
      minLon,
      lonRange,
      minLat,
      latRange,
      aspect
    };
  }, [geojson]);

  // Generar la cadena de recorrido del path SVG
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

  // Manejar movimiento de ratón para actualizar Tooltip
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
      totalConduces: 0, totalBultos: 0, conducesLista: []
    };
  }, [hoveredProvincia, statsPorProvincia]);

  const selectedProvData = useMemo(() => {
    if (!selectedProvDetail) return null;
    return statsPorProvincia[selectedProvDetail] || {
      totalConduces: 0, totalBultos: 0, conducesLista: []
    };
  }, [selectedProvDetail, statsPorProvincia]);

  return (
    <Card className="w-full border-border/40 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-royal-blue dark:text-white">
              <MapPin className="h-5 w-5 text-royal-yellow" />
              Bultos Entregados por Provincia
            </CardTitle>
            <CardDescription className="text-xs">
              Visualiza en tiempo real las provincias con conduces entregados.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground self-end sm:self-center">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-green-500/85 border border-green-600 block"></span>
              Con Entregas ({rankingProvincias.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-royal-light dark:bg-muted/10 border border-border block"></span>
              Sin Entregas
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingMap ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue"></div>
            <p className="text-sm">Cargando mapa interactivo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Contenedor del Mapa (3/4 de ancho en LG) */}
            <div 
              ref={mapContainerRef}
              className="lg:col-span-3 relative h-[380px] sm:h-[420px] bg-royal-light dark:bg-muted/10 rounded-xl border border-border/50 overflow-hidden flex items-center justify-center cursor-default select-none"
              onMouseMove={handleMouseMove}
            >
              <svg 
                className="w-full h-full p-2"
                viewBox="0 0 600 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {geojson?.features.map((feature, idx) => {
                  const nombreProvin = normalizarProvinciaMapa(feature.properties.shapeName);
                  const data = statsPorProvincia[nombreProvin];
                  const hasActividad = !!data && data.totalBultos > 0;
                  
                  // Paleta de colores Premium
                  let fill = "rgba(229, 231, 235, 0.15)"; 
                  let stroke = "rgba(107, 114, 128, 0.3)"; 
                  let strokeWidth = "1";
                  
                  if (hasActividad && data) {
                    // Gradiente de color basado en volumen de BULTOS entregados
                    const maxBultos = Math.max(...rankingProvincias.map(p => p.totalBultos), 1);
                    const ratio = data.totalBultos / maxBultos;
                    const opacity = 0.4 + ratio * 0.5; // De 0.4 a 0.9 de opacidad
                    
                    fill = `rgba(34, 197, 94, ${opacity})`; // verde
                    stroke = "#15803d"; 
                    strokeWidth = hoveredProvincia === nombreProvin ? "2" : "1.2";
                  } else if (hoveredProvincia === nombreProvin) {
                    fill = "rgba(156, 163, 175, 0.25)";
                    stroke = "rgba(107, 114, 128, 0.6)";
                  }
                  
                  // Resaltar al pasar el ratón
                  if (hoveredProvincia === nombreProvin) {
                    strokeWidth = "2.5";
                    if (hasActividad) {
                      stroke = "#16a34a"; 
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
                      onMouseEnter={() => setHoveredProvincia(nombreProvin)}
                      onMouseLeave={() => setHoveredProvincia(null)}
                      onClick={() => {
                        if (data && data.totalBultos > 0) {
                          setSelectedProvDetail(nombreProvin);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {/* Tooltip flotante */}
              {hoveredProvincia && hoveredData && (
                <div 
                  className="absolute z-55 pointer-events-none bg-popover text-popover-foreground rounded-lg border border-border p-3 shadow-xl min-w-[220px] animate-scale-in text-xs"
                  style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                >
                  <p className="font-bold text-sm text-royal-blue dark:text-white border-b pb-1 mb-1.5">
                    {hoveredProvincia}
                  </p>
                  {hoveredData.totalBultos > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 block"></span>
                          Entregados:
                        </span>
                        <span className="font-bold">{hoveredData.totalBultos} bultos</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-muted-foreground pt-1 border-t mt-1 text-[10px]">
                        <span>Total Conduces:</span>
                        <span className="font-bold text-foreground">{hoveredData.totalConduces}</span>
                      </div>
                      
                      <p className="text-[10px] text-muted-foreground pt-1 italic text-center border-t mt-1">
                        Haz clic para ver listado completo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-muted-foreground/80">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Sin Entregas</span>
                      </div>
                      <p className="text-[10px] pt-0.5 leading-relaxed">
                        No hay entregas registradas para esta provincia en el período seleccionado.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel Lateral - Ranking de Provincias (1/4 de ancho en LG) */}
            <div className="flex flex-col h-[380px] sm:h-[420px] border border-border/50 rounded-xl overflow-hidden bg-card">
              <div className="bg-royal-blue text-white p-3 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase">Bultos por Provincia</span>
                <Badge variant="secondary" className="bg-royal-yellow text-royal-blue text-[10px] hover:bg-royal-yellow/90">
                  Volumen
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-hide">
                {rankingProvincias.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground text-xs gap-2">
                    <Info className="h-5 w-5 text-muted-foreground/60" />
                    <span>No hay entregas registradas en el período actual</span>
                  </div>
                ) : (
                  rankingProvincias.map((prov, index) => (
                    <div 
                      key={prov.name} 
                      className={`p-3 transition-colors hover:bg-muted/40 cursor-pointer flex flex-col gap-1 text-xs ${selectedProvDetail === prov.name ? 'bg-royal-blue/5' : ''}`}
                      onClick={() => setSelectedProvDetail(prov.name)}
                      onMouseEnter={() => setHoveredProvincia(prov.name)}
                      onMouseLeave={() => setHoveredProvincia(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-muted-foreground w-4 shrink-0 text-center">{index + 1}</span>
                          <p className="font-bold text-foreground truncate">{prov.name}</p>
                        </div>
                        <Badge className="bg-royal-blue/10 text-royal-blue dark:text-white dark:bg-royal-blue/20 text-[9px] shrink-0 font-bold">
                          {prov.totalBultos} bultos
                        </Badge>
                      </div>
                      <div className="pl-6 text-[10px] text-muted-foreground">
                        <span>{prov.totalConduces} conduces entregados</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de Detalle de Conduces en Provincia Seleccionada */}
      <Dialog 
        open={!!selectedProvDetail} 
        onOpenChange={(open) => {
          if (!open) setSelectedProvDetail(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-royal-blue dark:text-white">
              <MapPin className="h-5 w-5 text-royal-yellow animate-bounce" />
              Conduces en {selectedProvDetail}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Listado detallado de conduces en esta provincia.
            </DialogDescription>
          </DialogHeader>

          {selectedProvData && (
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-1 text-center text-xs max-w-xs mx-auto">
                <div className="flex flex-col items-center justify-center p-2.5 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Entregados</span>
                  <span className="font-extrabold text-sm mt-1">{selectedProvData.totalBultos} bultos</span>
                  <span className="text-[10px] text-muted-foreground">({selectedProvData.totalConduces} cond.)</span>
                </div>
              </div>

              {/* Listado */}
              <div className="border rounded-lg overflow-hidden divide-y text-xs bg-card">
                {selectedProvData.conducesLista.map((conduce) => (
                  <div key={conduce.id} className="p-3 hover:bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{conduce.numeroConduce}</span>
                        {conduce.laboratorio && (
                          <Badge variant="outline" className="text-[10px] font-semibold py-0">
                            {conduce.laboratorio}
                          </Badge>
                        )}
                        <Badge 
                          className="text-[9px] font-bold py-0 border bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20"
                          variant="outline"
                        >
                          {conduce.estado}
                        </Badge>
                      </div>
                      <p className="font-semibold text-muted-foreground truncate">
                        {conduce.razonSocial || 'Cliente no identificado'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {conduce.ciudad}
                        </span>
                        {conduce.encomendado && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            Chofer: {conduce.encomendado}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-foreground flex items-center justify-end gap-1">
                          <Package className="h-3 w-3" />
                          {conduce.cantidadBultos} bultos
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {conduce.fechaEntrega ? new Date(conduce.fechaEntrega).toLocaleDateString() : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MapaEntregasRD;
