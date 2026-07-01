import React, { memo, useMemo, useCallback } from 'react';
import { Conduce } from '@/types/conduces';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, AlertCircle, Clock, Package, Truck, FileText, FlaskConical } from 'lucide-react';
import { LazyTransitTimeDisplay } from './LazyTransitTimeDisplay';
import { calculateTransitTime } from '@/utils/time/transitTime';
import { MobileConduceCard } from './MobileConduceCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useData } from '@/contexts/DataContext';

interface OptimizedConducesTableProps {
  conduces: Conduce[];
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  showDetails?: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  isSubmitting: boolean;
  type: 'pending' | 'completed' | 'returned';
  clienteBultosStats?: Record<string, { totalBultos: number; totalConduces: number }>;
  isAdmin?: boolean;
}

// Memoized row component for better performance
const ConduceRow = memo(({ 
  conduce, 
  type, 
  clienteStats, 
  isAdmin, 
  isSubmitting,
  onDelivery, 
  onReturn, 
  openGoogleMaps, 
  showDetails, 
  renderStatusBadge,
  getRowColorClass 
}: {
  conduce: Conduce;
  type: 'pending' | 'completed' | 'returned';
  clienteStats: { totalBultos: number; totalConduces: number };
  isAdmin: boolean;
  isSubmitting: boolean;
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  showDetails?: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  getRowColorClass: (conduce: Conduce) => string;
}) => {
  const { getClienteByNumero } = useData();
  const clientCache = getClienteByNumero(conduce.numeroCliente);
  const resolvedUbicacion = clientCache?.ubicacion || conduce.ubicacion;

  const handleRowClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }

    if (type === 'pending') {
      onDelivery(conduce);
    } else if (type === 'completed' && showDetails) {
      showDetails(conduce);
    }
  }, [conduce, type, onDelivery, showDetails]);

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openGoogleMaps(resolvedUbicacion, conduce.razonSocial);
  }, [resolvedUbicacion, conduce.razonSocial, openGoogleMaps]);

  const handleDeliveryClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelivery(conduce);
  }, [conduce, onDelivery]);

  const handleReturnClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReturn(conduce);
  }, [conduce, onReturn]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    showDetails?.(conduce);
  }, [conduce, showDetails]);

  return (
    <TableRow 
      className={`
        ${getRowColorClass(conduce)}
        ${type === 'pending' || (type === 'completed' && showDetails) ? 'cursor-pointer' : ''}
        transition-colors duration-150
      `}
      onClick={handleRowClick}
    >
      <TableCell className="py-2.5 text-center">
        <div className="flex items-center justify-center">
          <span className="font-bold text-base text-royal-blue dark:text-blue-300 bg-royal-blue/[0.04] dark:bg-blue-950/30 border border-royal-blue/10 dark:border-blue-900/50 px-3 py-1 rounded-md min-w-[32px] block text-center">
            {conduce.cantidadBultos}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-2.5">
        {conduce.laboratorio ? (
          <Badge
            className={`whitespace-nowrap font-bold text-xs shadow-sm ${
              conduce.laboratorio === 'LAM' 
                ? 'bg-royal-blue hover:bg-royal-blue/90 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {conduce.laboratorio}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      <TableCell className="py-2.5">
        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          {conduce.numeroConduce}
        </div>
        {type === 'pending' && conduce.prioridad && (
          <Badge className="mt-1 text-[10px] font-bold text-amber-700 border border-amber-200 bg-amber-50 rounded-md">
            Prioridad
          </Badge>
        )}
      </TableCell>

      <TableCell className="py-2.5">
        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          {conduce.razonSocial || '-'}
        </div>
      </TableCell>

      <TableCell className="py-2.5">
        <div className="space-y-1">
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
            ID: {conduce.numeroCliente || '-'}
          </div>
          {clienteStats.totalBultos > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-royal-blue dark:text-blue-300 bg-royal-blue/[0.04] dark:bg-blue-950/20 border border-royal-blue/10 dark:border-blue-900/50 px-2 py-0.5 rounded-md">
              <Package className="h-3 w-3 text-royal-blue/70 dark:text-blue-400" />
              {clienteStats.totalBultos} b. ({clienteStats.totalConduces} c.)
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="py-2.5">
        <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
          {conduce.ciudad || '-'}
        </span>
      </TableCell>

      <TableCell className="py-2.5 text-center">
        {resolvedUbicacion ? 
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMapClick}
            title="Ver en mapa de navegación"
            className="h-8 w-8 p-0 rounded-full hover:bg-royal-blue/10 hover:text-royal-blue dark:hover:bg-blue-950 dark:hover:text-blue-400 text-royal-blue dark:text-blue-400"
          >
            <MapPin className="h-4.5 w-4.5" />
          </Button>
          : <span className="text-slate-400 text-xs">-</span>
        }
      </TableCell>

      <TableCell className="py-2.5">
        {renderStatusBadge(conduce.estado)}
      </TableCell>

      <TableCell className="py-2.5">
        <LazyTransitTimeDisplay 
          fechaEntrega={conduce.fechaEntrega} 
          estado={conduce.estado} 
        />
      </TableCell>

      <TableCell className="py-2.5 w-[140px] min-w-[140px] px-2 text-center">
        <div className="space-y-1.5 w-full">
          {isAdmin && conduce.encomendado && (
            <div className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                {conduce.encomendado}
              </span>
            </div>
          )}
          
          {type === 'pending' ? (
            <div className="flex flex-col gap-1.5 w-full shrink-0">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-7 px-2 rounded-md shadow-sm w-full flex items-center justify-center gap-1 shrink-0"
                onClick={handleDeliveryClick}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Entregar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold text-[11px] h-7 px-2 rounded-md shadow-sm bg-white w-full flex items-center justify-center gap-1 shrink-0"
                onClick={handleReturnClick}
                disabled={isSubmitting}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Devolver
              </Button>
            </div>
          ) : (
            type === 'completed' && showDetails ? (
              <Button 
                size="sm" 
                variant="outline"
                className="hover:bg-slate-100 font-bold text-[11px] h-7 w-full flex items-center justify-center"
                onClick={handleDetailsClick}
              >
                Ver detalles
              </Button>
            ) : (
              <span className="text-xs text-slate-600 dark:text-slate-400 italic block text-center">
                {conduce.nota || 'Sin información'}
              </span>
            )
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

ConduceRow.displayName = 'ConduceRow';

export const OptimizedConducesTable = memo(({
  conduces,
  onDelivery,
  onReturn,
  openGoogleMaps,
  showDetails,
  renderStatusBadge,
  isSubmitting,
  type,
  clienteBultosStats = {},
  isAdmin = false
}: OptimizedConducesTableProps) => {
  const isMobile = useIsMobile();

  // Memoize the color calculation function
  const getRowColorClass = useCallback((conduce: Conduce) => {
    let borderClass = 'border-l-4 border-l-slate-200 dark:border-l-slate-800';
    
    if (conduce.estado === 'En tránsito') {
      const transitInfo = calculateTransitTime(conduce.fechaEntrega);
      switch (transitInfo.status) {
        case 'normal':
          borderClass = 'border-l-4 border-l-emerald-500';
          break;
        case 'warning':
          borderClass = 'border-l-4 border-l-amber-500';
          break;
        case 'expired':
          borderClass = 'border-l-4 border-l-rose-500';
          break;
      }
    } else if (type === 'completed') {
      borderClass = 'border-l-4 border-l-emerald-500';
    } else if (type === 'returned') {
      borderClass = 'border-l-4 border-l-rose-500';
    } else if (type === 'pending' && conduce.prioridad) {
      borderClass = 'border-l-4 border-l-amber-500';
    }

    return `${borderClass} bg-white dark:bg-slate-950 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 border-b border-border/50 transition-all duration-150`;
  }, [type]);

  // Memoize empty state message
  const emptyMessage = useMemo(() => {
    return type === 'pending' ? 'entregas pendientes' : 
           type === 'completed' ? 'entregas completadas' : 'devoluciones registradas';
  }, [type]);

  if (conduces.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay {emptyMessage}
      </div>
    );
  }

  // Vista móvil con tarjetas
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 p-2">
        {conduces.map((conduce) => (
          <MobileConduceCard
            key={conduce.id}
            conduce={conduce}
            type={type}
            isSubmitting={isSubmitting}
            onDelivery={onDelivery}
            onReturn={onReturn}
            openGoogleMaps={openGoogleMaps}
            showDetails={showDetails}
            renderStatusBadge={renderStatusBadge}
          />
        ))}
      </div>
    );
  }

  // Vista desktop con tabla
  return (
    <Table className="w-full text-xs md:text-sm min-w-[1000px]">
      <TableHeader className="bg-royal-blue">
        <TableRow className="bg-royal-blue hover:bg-royal-blue border-b-2 border-royal-yellow/50">
          <TableHead className="font-bold text-white bg-royal-blue w-14 text-center py-2.5">
            <div className="flex items-center gap-1 justify-center">
              <Package className="h-3.5 w-3.5 text-royal-yellow" />
              Bultos
            </div>
          </TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-14 py-2.5">
            <div className="flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5 text-royal-yellow" />
              Lab
            </div>
          </TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-24 py-2.5">
            <div className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-royal-yellow" />
              Conduce
            </div>
          </TableHead>
          <TableHead className="font-bold text-white bg-royal-blue py-2.5">
            <div className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-royal-yellow" />
              Razón Social
            </div>
          </TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-32 py-2.5">
            <div className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-royal-yellow" />
              Cliente / Bultos
            </div>
          </TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-24 py-2.5">Ciudad</TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-14 text-center py-2.5">Ubicación</TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-24 py-2.5">Estado</TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-28 py-2.5">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-royal-yellow" />
              Tiempo Tránsito
            </div>
          </TableHead>
          <TableHead className="font-bold text-white bg-royal-blue w-[140px] min-w-[140px] py-2.5 text-center">
            {isAdmin && (
              <div className="flex items-center gap-1.5 mb-1 justify-center">
                <Truck className="h-3.5 w-3.5 text-royal-yellow" />
                Encomendado
              </div>
            )}
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conduces.map((conduce) => {
          const clienteStats = clienteBultosStats[conduce.numeroCliente] || { totalBultos: 0, totalConduces: 0 };
          
          return (
            <ConduceRow
              key={conduce.id}
              conduce={conduce}
              type={type}
              clienteStats={clienteStats}
              isAdmin={isAdmin}
              isSubmitting={isSubmitting}
              onDelivery={onDelivery}
              onReturn={onReturn}
              openGoogleMaps={openGoogleMaps}
              showDetails={showDetails}
              renderStatusBadge={renderStatusBadge}
              getRowColorClass={getRowColorClass}
            />
          );
        })}
      </TableBody>
    </Table>
  );
});

OptimizedConducesTable.displayName = 'OptimizedConducesTable';