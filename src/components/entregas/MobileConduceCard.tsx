import React, { memo, useCallback } from 'react';
import { Conduce } from '@/types/conduces';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, CheckCircle, AlertCircle, Package, Clock, Navigation } from 'lucide-react';
import { LazyTransitTimeDisplay } from './LazyTransitTimeDisplay';
import { calculateTransitTime } from '@/utils/time/transitTime';

interface MobileConduceCardProps {
  conduce: Conduce;
  type: 'pending' | 'completed' | 'returned';
  isSubmitting: boolean;
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  showDetails?: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
}

export const MobileConduceCard = memo(({
  conduce,
  type,
  isSubmitting,
  onDelivery,
  onReturn,
  openGoogleMaps,
  showDetails,
  renderStatusBadge
}: MobileConduceCardProps) => {
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
          {conduce.laboratorio && (
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

      {/* Info del cliente */}
      <div className="mb-3 space-y-1">
        <div className="font-medium text-slate-700 text-sm truncate">
          {conduce.razonSocial || 'Sin razón social'}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Cliente: {conduce.numeroCliente}</span>
          <span>•</span>
          <span>{conduce.ciudad || 'Sin ciudad'}</span>
        </div>
      </div>

      {/* Estado y tiempo */}
      <div className="flex items-center gap-2 mb-4">
        {renderStatusBadge(conduce.estado)}
        <div className="flex-1">
          <LazyTransitTimeDisplay 
            fechaEntrega={conduce.fechaEntrega} 
            estado={conduce.estado} 
          />
        </div>
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
          {conduce.ubicacion && (
            <Button 
              variant="outline"
              className="w-full h-10 text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={handleMapClick}
            >
              <Navigation className="h-4 w-4 mr-2" />
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
