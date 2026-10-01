import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truck, MapPin, Users, Search, Route, Navigation, Clock, Package } from 'lucide-react';
import { getTruckColor } from './truckColors';
import { TruckCurrentLocation, formatSimpleTime } from './truckLocationUtils';
import { normalizeTruckCode } from '@/utils/trucksByRegion';

export interface TruckStatsItem {
  truckName: string;
  bultosPendientes: number;
  bultosEntregados: number;
  bultosDevueltos?: number;
  totalBultos: number;
  conducesPendientes: number;
  conducesEntregados: number;
  conducesDevueltos?: number;
  totalConduces: number;
  clientesCount: number;
  percentEntregado: number;
}

interface TruckFleetPanelProps {
  trucks: TruckStatsItem[];
  selectedTruck: string | null;
  onSelectTruck: (truck: string | null) => void;
  onFocusTruck?: (truck: string) => void;
  truckLocations?: Map<string, TruckCurrentLocation>;
  isLoading?: boolean;
}

export const TruckFleetPanel: React.FC<TruckFleetPanelProps> = ({
  trucks,
  selectedTruck,
  onSelectTruck,
  onFocusTruck,
  truckLocations,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrucks = trucks.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const loc = truckLocations?.get(t.truckName);
    return (
      t.truckName.toLowerCase().includes(query) ||
      loc?.driverName?.toLowerCase().includes(query) ||
      loc?.lastCity?.toLowerCase().includes(query) ||
      loc?.lastStopName?.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      {/* Cabecera Minimalista */}
      <CardHeader className="p-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-royal-blue dark:text-royal-yellow" />
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Camiones en Ruta {isLoading && filteredTrucks.length === 0 ? '' : `(${trucks.length})`}
            </CardTitle>
          </div>

          {selectedTruck && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectTruck(null)}
              className="h-6 text-[11px] px-2 text-slate-500 hover:text-slate-900 font-medium"
            >
              Ver todos
            </Button>
          )}
        </div>

        {/* Buscador Sutil */}
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar camión o ciudad..."
            className="h-7 text-xs pl-7 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400"
          />
        </div>
      </CardHeader>

      <CardContent className="p-2 flex-1 min-h-0">
        <ScrollArea className="h-[560px] lg:h-[calc(100vh-270px)] pr-2">
          <div className="space-y-2">
            {isLoading && filteredTrucks.length === 0 ? (
              <div className="space-y-2 p-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredTrucks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No hay camiones para el filtro actual
              </div>
            ) : (
              filteredTrucks.map((truck) => {
                const isSelected = selectedTruck !== null && normalizeTruckCode(selectedTruck) === normalizeTruckCode(truck.truckName);
                const colors = getTruckColor(truck.truckName);
                const loc = truckLocations?.get(truck.truckName);
                const formattedTime = formatSimpleTime(loc?.lastTime);

                return (
                  <div
                    key={truck.truckName}
                    onClick={() => onSelectTruck(isSelected ? null : truck.truckName)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none bg-white dark:bg-slate-800/60 ${
                      isSelected
                        ? 'border-royal-blue bg-blue-50/30 dark:bg-blue-950/20 shadow-xs ring-1 ring-royal-blue/30'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Fila Superior: Camión, Chofer y Porcentaje */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold text-white shrink-0 tracking-wide"
                          style={{ backgroundColor: colors.hex }}
                        >
                          {truck.truckName}
                        </span>
                        <div className="min-w-0">
                          {loc?.driverName ? (
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-none">
                              {loc.driverName}
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-none">
                              Camión {truck.truckName}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {truck.clientesCount} clientes asignados
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {truck.percentEntregado}%
                      </span>
                    </div>

                    {/* Bloque Minimalista de Ubicación Actual y Último Bulto Entregado */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 mb-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[210px] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{loc?.lastStopName || 'En base central'}</span>
                        </span>
                        {formattedTime && (
                          <span 
                            title={loc?.lastDateTime ? `Entregado: ${loc.lastDateTime}` : formattedTime}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 text-[10px] font-medium shrink-0 flex items-center gap-0.5 ml-1"
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {formattedTime}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] pl-4 mt-1">
                        <span className="text-slate-400 truncate">
                          {loc?.lastCity || ''}
                          {loc?.lastClientNumero ? ` · #${loc.lastClientNumero}` : ''}
                        </span>
                        {loc?.lastBultosCount !== undefined && loc?.lastBultosCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50 shrink-0 ml-1">
                            <Package className="h-2.5 w-2.5" />
                            <span>Último: {loc.lastBultosCount} {loc.lastBultosCount === 1 ? 'bulto' : 'bultos'}</span>
                            {loc.lastFactura ? <span className="font-bold text-emerald-900 dark:text-emerald-200">· Fac #{loc.lastFactura}</span> : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Fila de Bultos: Pendientes y Entregados */}
                    <div className="flex items-center justify-between text-xs py-1 text-slate-600 dark:text-slate-300 mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span className="text-[11px]">
                            <strong className="text-slate-900 dark:text-white font-bold">{truck.bultosPendientes}</strong> pendientes
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="text-[11px]">
                            <strong className="text-slate-900 dark:text-white font-bold">{truck.bultosEntregados}</strong> entregados
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{truck.totalBultos} total</span>
                    </div>

                    {/* Barra de Progreso Fina */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1 overflow-hidden mb-2">
                      <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${truck.percentEntregado}%`,
                          backgroundColor: colors.hex
                        }}
                      />
                    </div>

                    {/* Acciones Minimalistas */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTruck(isSelected ? null : truck.truckName);
                        }}
                      >
                        <Route className="h-3 w-3 mr-1 opacity-70" />
                        {isSelected ? 'Ocultar' : 'Ver paradas'}
                      </Button>

                      {onFocusTruck && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] font-semibold text-royal-blue border-royal-blue/30 hover:bg-royal-blue hover:text-white px-2.5 rounded-md transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFocusTruck(truck.truckName);
                          }}
                        >
                          <Navigation className="h-2.5 w-2.5 mr-1" />
                          Ubicar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
