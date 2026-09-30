import React, { memo, useState } from 'react';
import { Conduce } from '@/types/conduces';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Warehouse, Navigation, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WarehouseDeliveriesSectionProps {
  conduces: Conduce[];
  loading?: boolean;
  onUpdateRoute: (conduceId: string, newRoute: string) => Promise<boolean>;
  onMoveToTruck: (conduceId: string) => Promise<boolean>;
  openGoogleMaps?: (ubicacion: string | undefined, clienteNombre?: string) => void;
  userCamion?: string;
  isAdmin?: boolean;
}

export const WarehouseDeliveriesSection = memo(({
  conduces,
  loading = false,
  onUpdateRoute,
  onMoveToTruck,
  openGoogleMaps,
  userCamion,
  isAdmin = false
}: WarehouseDeliveriesSectionProps) => {
  const isMobile = useIsMobile();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [updatingRouteId, setUpdatingRouteId] = useState<string | null>(null);
  const [movingAll, setMovingAll] = useState(false);

  const totalBultos = conduces.reduce((sum, c) => sum + (c.cantidadBultos || 0), 0);

  const handleRouteSelect = async (conduceId: string, route: string) => {
    try {
      setUpdatingRouteId(conduceId);
      await onUpdateRoute(conduceId, route);
    } finally {
      setUpdatingRouteId(null);
    }
  };

  const handleMoveSingle = async (conduceId: string) => {
    try {
      setMovingId(conduceId);
      await onMoveToTruck(conduceId);
    } finally {
      setMovingId(null);
    }
  };

  const handleMoveAll = async () => {
    if (conduces.length === 0 || movingAll) return;
    setMovingAll(true);
    try {
      for (const c of conduces) {
        await onMoveToTruck(c.id);
      }
    } finally {
      setMovingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        <p className="text-xs">Cargando conduces en almacén...</p>
      </div>
    );
  }

  if (conduces.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center mx-2 my-2">
        <Warehouse className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-foreground">Tu almacén está vacío</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          No tienes conduces guardados en almacén. Todos tus conduces asignados están listos en tu camión.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-2">
      {/* Barra de resumen y acción masiva */}
      <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-xl px-3.5 py-2.5 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-amber-700" />
          <span className="text-xs font-semibold text-amber-900">
            {conduces.length} conduce{conduces.length !== 1 ? 's' : ''} en almacén
          </span>
          <span className="text-amber-500 font-bold">·</span>
          <span className="text-xs font-medium text-amber-800">
            {totalBultos} bulto{totalBultos !== 1 ? 's' : ''}
          </span>
        </div>

        <Button
          size="sm"
          onClick={handleMoveAll}
          disabled={movingAll || conduces.length === 0}
          className="bg-amber-600 hover:bg-amber-700 text-white h-7 px-3 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
        >
          {movingAll ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Truck className="h-3 w-3" />
          )}
          Cargar todos a mi camión
        </Button>
      </div>

      {/* Lista de conduces en almacén */}
      {isMobile ? (
        <div className="flex flex-col gap-2.5">
          {conduces.map((conduce) => {
            const currentRoute = (conduce.ruta ?? '0').trim();
            const isMoving = movingId === conduce.id;
            const isUpdating = updatingRouteId === conduce.id;

            return (
              <Card key={conduce.id} className="border border-border/70 shadow-xs bg-card p-3 space-y-2.5">
                {/* Cabecera del conduce */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center bg-amber-100 text-amber-800 rounded-lg px-2.5 py-1.5 shrink-0">
                      <Package className="h-3.5 w-3.5 mr-1 text-amber-700" />
                      <span className="font-bold text-sm">{conduce.cantidadBultos}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-foreground">
                        {conduce.numeroConduce}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {conduce.numeroFactura || 'Sin factura'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px] font-mono border-amber-300 bg-amber-50 text-amber-800">
                      En Almacén
                    </Badge>
                    {conduce.laboratorio && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {conduce.laboratorio}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cliente y ubicación */}
                <div className="space-y-0.5 pt-0.5">
                  <p className="text-xs font-medium text-foreground truncate">
                    {conduce.razonSocial || 'Sin razón social'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Cliente {conduce.numeroCliente} {conduce.ciudad ? `· ${conduce.ciudad}` : ''}
                  </p>
                </div>

                {/* Selector de Ruta y Botón de Mover a Camión */}
                <div className="pt-1 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
                  {/* Selector de ruta */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground">Ruta:</span>
                    <Select
                      value={currentRoute || '0'}
                      onValueChange={(val) => handleRouteSelect(conduce.id, val)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs font-semibold border-border/70 bg-background">
                        <SelectValue placeholder="Ruta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Ruta 0</SelectItem>
                        <SelectItem value="1">Ruta 1</SelectItem>
                        <SelectItem value="2">Ruta 2</SelectItem>
                      </SelectContent>
                    </Select>
                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {conduce.ubicacion && openGoogleMaps && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openGoogleMaps(conduce.ubicacion, conduce.razonSocial)}
                        className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                        title="Ver mapa"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleMoveSingle(conduce.id)}
                      disabled={isMoving}
                      className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs flex items-center gap-1"
                    >
                      {isMoving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Truck className="h-3 w-3" />
                      )}
                      Cargar a camión
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vista de escritorio en tabla */
        <div className="border border-border/70 rounded-xl overflow-hidden bg-card shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border/70">
              <tr>
                <th className="py-2.5 px-3">Bultos</th>
                <th className="py-2.5 px-3">Conduce / Factura</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Ciudad</th>
                <th className="py-2.5 px-3">Ruta</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {conduces.map((conduce) => {
                const currentRoute = (conduce.ruta ?? '0').trim();
                const isMoving = movingId === conduce.id;
                const isUpdating = updatingRouteId === conduce.id;

                return (
                  <tr key={conduce.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        {conduce.cantidadBultos}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">{conduce.numeroConduce}</div>
                      <div className="text-[11px] text-muted-foreground">{conduce.numeroFactura || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{conduce.razonSocial || 'Sin cliente'}</div>
                      <div className="text-[11px] text-muted-foreground">({conduce.numeroCliente})</div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {conduce.ciudad || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={currentRoute || '0'}
                          onValueChange={(val) => handleRouteSelect(conduce.id, val)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs font-semibold border-border/70 bg-background">
                            <SelectValue placeholder="Ruta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Ruta 0</SelectItem>
                            <SelectItem value="1">Ruta 1</SelectItem>
                            <SelectItem value="2">Ruta 2</SelectItem>
                          </SelectContent>
                        </Select>
                        {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {conduce.ubicacion && openGoogleMaps && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openGoogleMaps(conduce.ubicacion, conduce.razonSocial)}
                            className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleMoveSingle(conduce.id)}
                          disabled={isMoving}
                          className="h-7 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs flex items-center gap-1.5"
                        >
                          {isMoving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Truck className="h-3.5 w-3.5" />
                          )}
                          Cargar a camión
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

WarehouseDeliveriesSection.displayName = 'WarehouseDeliveriesSection';
