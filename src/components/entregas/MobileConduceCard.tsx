import React, { memo, useCallback } from 'react';
import { Conduce } from '@/types/conduces';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, CheckCircle, AlertCircle, Package, Clock, Navigation } from 'lucide-react';
import { LazyTransitTimeDisplay } from './LazyTransitTimeDisplay';
import { calculateTransitTime } from '@/utils/time/transitTime';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';
import { useData } from '@/contexts/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { formatDistance } from '@/utils/geo/distanceUtils';

interface MobileConduceCardProps {
  conduce: Conduce;
  type: 'pending' | 'completed' | 'returned';
  isSubmitting: boolean;
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  showDetails?: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  onUpdateRoute?: (conduceId: string, newRoute: string) => Promise<boolean>;
  distanceKm?: number | null;
  isNearest?: boolean;
}

export const MobileConduceCard = memo(({
  conduce,
  type,
  isSubmitting,
  onDelivery,
  onReturn,
  openGoogleMaps,
  showDetails,
  renderStatusBadge,
  onUpdateRoute,
  distanceKm,
  isNearest = false
}: MobileConduceCardProps) => {
  const { user } = useAuth();
  const { updateConduce } = useData();
  const isAdmin = isAdministrator(user);

  const handleDeliveryClick = useCallback(() => {
    onDelivery(conduce);
  }, [conduce, onDelivery]);

  const handleReturnClick = useCallback(() => {
    onReturn(conduce);
  }, [conduce, onReturn]);

  const handleMapClick = useCallback(() => {
    openGoogleMaps(conduce.ubicacion, conduce.razonSocial);
  }, [conduce.ubicacion, conduce.razonSocial, openGoogleMaps]);

  const handleDetailsClick = useCallback(() => {
    showDetails?.(conduce);
  }, [conduce, showDetails]);

  const getCardBorderColor = () => {
    if (conduce.estado === 'En tránsito') {
      const transitInfo = calculateTransitTime(conduce.fechaEntrega);
      switch (transitInfo.status) {
        case 'normal':
          return 'border-l-4 border-l-green-500 bg-green-50/50';
        case 'warning':
          return 'border-l-4 border-l-yellow-500 bg-yellow-50/50';
        case 'expired':
          return 'border-l-4 border-l-red-500 bg-red-50/50';
        default:
          return '';
      }
    }
    if (type === 'pending' && conduce.prioridad) {
      return 'border-l-4 border-l-yellow-500 bg-yellow-50/50';
    }
    if (type === 'completed') {
      return 'border-l-4 border-l-green-500 bg-green-50/50';
    }
    if (type === 'returned') {
      return 'border-l-4 border-l-orange-500 bg-orange-50/50';
    }
    return '';
  };

  return (
    <Card className={`p-4 ${getCardBorderColor()} shadow-sm`}>
      {/* Header con bultos, conduce y laboratorio */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center bg-slate-200 rounded-lg px-3 py-2">
            <Package className="h-4 w-4 text-slate-600 mr-1" />
            <span className="font-bold text-lg text-slate-800">{conduce.cantidadBultos}</span>
          </div>
          <div>
            <div className="font-semibold text-slate-900">{conduce.numeroConduce}</div>
            <div className="text-xs text-slate-500">{conduce.numeroFactura}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isAdmin && conduce.laboratorio && (
            <Badge 
              variant={conduce.laboratorio === 'LAM' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {conduce.laboratorio}
            </Badge>
          )}
          {conduce.prioridad && type === 'pending' && (
            <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-400 bg-yellow-50">
              Prioridad
            </Badge>
          )}
        </div>
      </div>

      {/* Info del cliente y Ruta */}
      <div className="mb-3 space-y-1">
        <div className="font-medium text-slate-700 text-sm truncate">
          {conduce.razonSocial || 'Sin razón social'}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <span>Cliente: {conduce.numeroCliente}</span>
            <span>•</span>
            <span>{conduce.ciudad || 'Sin ciudad'}</span>
          </div>

          {/* Selector de Ruta editable por chofer */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-semibold text-slate-400">Ruta:</span>
            <Select
              value={(conduce.ruta ?? '0').trim() || '0'}
              onValueChange={async (val) => {
                if (onUpdateRoute) {
                  await onUpdateRoute(conduce.id, val);
                } else {
                  await updateConduce(conduce.id, { ruta: val });
                }
              }}
            >
              <SelectTrigger className="h-6 w-20 text-[11px] font-bold border-slate-300 bg-white px-2 py-0">
                <SelectValue placeholder="Ruta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Ruta 0</SelectItem>
                <SelectItem value="1">Ruta 1</SelectItem>
                <SelectItem value="2">Ruta 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Estado, tiempo y distancia */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {renderStatusBadge(conduce.estado)}
        <div className="flex-1">
          <LazyTransitTimeDisplay 
            fechaEntrega={conduce.fechaEntrega} 
            estado={conduce.estado} 
          />
        </div>
        {distanceKm !== undefined && distanceKm !== null && (
          isNearest ? (
            <Badge variant="outline" className="bg-emerald-50/90 text-emerald-800 border-emerald-300 font-medium text-xs py-0.5 px-2 flex items-center gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatDistance(distanceKm)} · más cerca</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal text-xs py-0.5 px-2 flex items-center gap-1 shrink-0">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{formatDistance(distanceKm)}</span>
            </Badge>
          )
        )}
      </div>

      {/* Botones de acción - MÁS GRANDES Y ACCESIBLES */}
      {type === 'pending' ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
              onClick={handleDeliveryClick}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Entregar
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-orange-600 border-orange-400 hover:bg-orange-50 h-12 text-base font-semibold"
              onClick={handleReturnClick}
              disabled={isSubmitting}
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Devolver
            </Button>
          </div>
          
          {/* Botón de ubicación */}
          {(conduce.ubicacion || (distanceKm !== undefined && distanceKm !== null)) && (
            <Button 
              variant="outline"
              className="w-full h-9 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-normal text-xs"
              onClick={handleMapClick}
            >
              <Navigation className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Ver ubicación en mapa
            </Button>
          )}
        </div>
      ) : type === 'completed' && showDetails ? (
        <Button 
          size="lg"
          variant="outline"
          className="w-full h-12 text-base"
          onClick={handleDetailsClick}
        >
          Ver detalles de entrega
        </Button>
      ) : (
        <div className="text-sm text-slate-600 italic p-2 bg-slate-50 rounded">
          {conduce.nota || 'Sin información adicional'}
        </div>
      )}
    </Card>
  );
});

MobileConduceCard.displayName = 'MobileConduceCard';
