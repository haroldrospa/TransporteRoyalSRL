
import { Conduce } from '@/types/conduces';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, AlertCircle, Loader2, Clock, Package, Truck, FileText } from 'lucide-react';
import TransitTimeDisplay from '@/components/shared/TransitTimeDisplay';
import { calculateTransitTime } from '@/utils/time/transitTime';

interface ConducesTableProps {
  conduces: Conduce[];
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined) => void;
  showDetails?: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  isSubmitting: boolean;
  type: 'pending' | 'completed' | 'returned';
  clienteBultosStats?: Record<string, { totalBultos: number; totalConduces: number }>;
  isAdmin?: boolean;
}

export const ConducesTable = ({
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
}: ConducesTableProps) => {
  if (conduces.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={11} className="h-24 text-center">
          No hay {type === 'pending' ? 'entregas pendientes' : 
                  type === 'completed' ? 'entregas completadas' : 'devoluciones registradas'}
        </TableCell>
      </TableRow>
    );
  }

  const handleRowClick = (conduce: Conduce, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on buttons or interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }

    // Only trigger delivery dialog for pending conduces
    if (type === 'pending') {
      onDelivery(conduce);
    } else if (type === 'completed' && showDetails) {
      showDetails(conduce);
    }
  };

  const getRowColorClass = (conduce: Conduce) => {
    // Only apply transit time colors for "En tránsito" conduces
    if (conduce.estado === 'En tránsito') {
      const transitInfo = calculateTransitTime(conduce.fechaEntrega);
      
      switch (transitInfo.status) {
        case 'normal':
          return 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-400';
        case 'warning':
          return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400';
        case 'expired':
          return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-400';
        default:
          return 'hover:bg-slate-50';
      }
    }

    // Default colors for other states
    if (type === 'pending' && conduce.prioridad) {
      return 'bg-yellow-50 hover:bg-yellow-100';
    } else if (type === 'completed') {
      return 'bg-green-50 hover:bg-green-100';
    } else if (type === 'returned') {
      return 'bg-orange-50 hover:bg-orange-100';
    } else {
      return 'hover:bg-slate-50';
    }
  };

  return (
    <>
      <TableHeader>
        <TableRow className="bg-slate-100 hover:bg-slate-100">
          <TableHead className="font-semibold text-slate-700 w-24 text-center">
            <div className="flex items-center gap-2 justify-center">
              <Package className="h-4 w-4" />
              Bultos
            </div>
          </TableHead>
          <TableHead className="font-semibold text-slate-700 w-32">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Conduce
            </div>
          </TableHead>
          <TableHead className="font-semibold text-slate-700 w-48">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Razón Social
            </div>
          </TableHead>
          <TableHead className="font-semibold text-slate-700 w-32">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Factura
            </div>
          </TableHead>
          <TableHead className="font-semibold text-slate-700 w-40">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Cliente / Bultos
            </div>
          </TableHead>
          <TableHead className="font-semibold text-slate-700 w-28">Ciudad</TableHead>
          <TableHead className="font-semibold text-slate-700 w-20">Ubicación</TableHead>
          <TableHead className="font-semibold text-slate-700 w-28">Estado</TableHead>
          <TableHead className="font-semibold text-slate-700 w-32">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo Tránsito
            </div>
          </TableHead>
          <TableHead className="font-semibold text-slate-700 min-w-48">
            {isAdmin && (
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4" />
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
            <TableRow 
              key={conduce.id}
              className={`
                ${getRowColorClass(conduce)}
                ${type === 'pending' ? 'cursor-pointer' : 
                  type === 'completed' && showDetails ? 'cursor-pointer' : ''}
                transition-colors duration-150
              `}
              onClick={(e) => handleRowClick(conduce, e)}
            >
              <TableCell className="py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-lg text-slate-800 bg-slate-100 px-3 py-1 rounded">
                    {conduce.cantidadBultos}
                  </span>
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="font-medium text-slate-900">
                  {conduce.numeroConduce}
                </div>
                {type === 'pending' && conduce.prioridad && (
                  <Badge variant="outline" className="mt-1 text-xs text-yellow-700 border-yellow-400 bg-yellow-50">
                    Prioridad
                  </Badge>
                )}
              </TableCell>

              <TableCell className="py-4">
                <div className="font-medium text-slate-700">
                  {conduce.razonSocial || '-'}
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm">
                    {conduce.numeroFactura}
                  </div>
                </div>
              </TableCell>

              <TableCell className="py-4">
                <div className="space-y-1">
                  <div className="font-medium text-slate-900">
                    {conduce.numeroCliente || '-'}
                  </div>
                  {clienteStats.totalBultos > 0 && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                        {clienteStats.totalBultos} bultos ({clienteStats.totalConduces} conduces)
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-4">
                <span className="text-slate-700 font-medium">
                  {conduce.ciudad || '-'}
                </span>
              </TableCell>

              <TableCell className="py-4 text-center">
                {conduce.ubicacion ? 
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGoogleMaps(conduce.ubicacion);
                    }}
                    title="Ver en Google Maps"
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </Button>
                  : <span className="text-slate-400">-</span>
                }
              </TableCell>

              <TableCell className="py-4">
                {renderStatusBadge(conduce.estado)}
              </TableCell>

              <TableCell className="py-4">
                <TransitTimeDisplay 
                  fechaEntrega={conduce.fechaEntrega} 
                  estado={conduce.estado} 
                />
              </TableCell>

              <TableCell className="py-4">
                <div className="space-y-2">
                  {/* Show truck info for admins */}
                  {isAdmin && conduce.encomendado && (
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {conduce.encomendado}
                      </span>
                    </div>
                  )}
                  
                  {type === 'pending' ? (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelivery(conduce);
                        }}
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Entregar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-orange-600 border-orange-400 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReturn(conduce);
                        }}
                        disabled={isSubmitting}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Devolver
                      </Button>
                    </div>
                  ) : (
                    type === 'completed' && showDetails ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="hover:bg-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDetails(conduce);
                        }}
                      >
                        Ver detalles
                      </Button>
                    ) : (
                      <span className="text-sm text-slate-600 italic">
                        {conduce.nota || 'Sin información'}
                      </span>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </>
  );
};
