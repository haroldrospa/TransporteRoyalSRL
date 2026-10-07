
import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Conduce } from '@/types/conduces';
import { isConduceDelayed } from '@/utils/time';
import { formatDeliveryTime } from '@/utils/lamUtils';
import { Package, Edit, Clock, FileText, User, Building2, MapPin, Truck, AlertTriangle, Star, FlaskConical, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import TransitTimeDisplay from '@/components/shared/TransitTimeDisplay';
import { formatReadableDate } from '@/utils/dateFormatters';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';

interface ConducesTableRowProps {
  conduce: Conduce;
  index: number;
  isLamUser: boolean;
  onConduceClick: (conduce: Conduce) => void;
}

const ConducesTableRow = ({ conduce, index, isLamUser, onConduceClick }: ConducesTableRowProps) => {
  const { user } = useAuth();
  const isAdmin = isAdministrator(user);
  const { updateConduce } = useData();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newEstado: string) => {
    if (newEstado === conduce.estado) return;

    try {
      setIsUpdatingStatus(true);
      if (newEstado === 'En tránsito') {
        await updateConduce(conduce.id, {
          estado: 'En tránsito',
          tiempoEntrega: '',
          horaEntregaExacta: '',
          firma: '',
          imagen: '',
          cantidadEntregados: 0,
          bultoModificado: false,
          bultoModificacionNota: '',
        });
        toast({
          title: 'Conduce puesto en tránsito',
          description: `Conduce #${conduce.numeroConduce} cambiado a "En tránsito".`,
        });
      } else if (newEstado === 'Entregado') {
        const now = new Date();
        const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await updateConduce(conduce.id, {
          estado: 'Entregado',
          tiempoEntrega: horaStr,
          horaEntregaExacta: now.toISOString(),
          cantidadEntregados: conduce.cantidadBultos || 1,
        });
        toast({
          title: 'Conduce entregado',
          description: `Conduce #${conduce.numeroConduce} marcado como "Entregado".`,
        });
      } else if (newEstado === 'Devuelto') {
        await updateConduce(conduce.id, {
          estado: 'Devuelto',
        });
        toast({
          title: 'Conduce devuelto',
          description: `Conduce #${conduce.numeroConduce} marcado como "Devuelto".`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del conduce',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getRowClassName = (conduce: Conduce) => {
    const baseClasses = "group hover:shadow-lg transition-all duration-300 border-b border-gray-100";
    switch (conduce.estado) {
      case 'En tránsito':
        return `${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100`;
      case 'Entregado':
        return isConduceDelayed(conduce) 
          ? `${baseClasses} bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 cursor-pointer` 
          : `${baseClasses} bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 cursor-pointer`;
      case 'Devuelto':
        return `${baseClasses} bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 cursor-pointer`;
      default:
        return `${baseClasses} bg-white hover:bg-gray-50`;
    }
  };

  return (
    <TableRow 
      key={conduce.id} 
      className={getRowClassName(conduce)} 
      onClick={() => onConduceClick(conduce)} 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <TableCell className="font-semibold text-slate-800 py-2 px-2 border-r border-gray-100 text-xs">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-slate-500" />
          <span className="truncate">{conduce.numeroFactura}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium text-slate-700 py-2 px-2 border-r border-gray-100 text-xs">
        <span className="truncate">{conduce.numeroConduce}</span>
      </TableCell>
      {isAdmin && (
        <TableCell 
          className="text-slate-700 py-2 px-2 border-r border-gray-100 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            value={conduce.laboratorio || 'LAM'}
            onValueChange={async (newLab) => {
              try {
                await updateConduce(conduce.id, { laboratorio: newLab });
                toast({
                  title: 'Laboratorio actualizado',
                  description: `Conduce ${conduce.numeroConduce} cambiado a ${newLab}`,
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'No se pudo actualizar el laboratorio',
                  variant: 'destructive',
                });
              }
            }}
          >
            <SelectTrigger className="h-7 text-[11px] font-semibold bg-white border-slate-200 shadow-none px-2 py-0">
              <SelectValue placeholder="Laboratorio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LAM">LAM</SelectItem>
              <SelectItem value="Fersuaz">Fersuaz</SelectItem>
              <SelectItem value="Taapharmaceutica">Taapharmaceutica</SelectItem>
              <SelectItem value="Innovacion Quimica">Innovacion Quimica</SelectItem>
              <SelectItem value="Krishpar Care Dominicana">Krishpar Care Dominicana</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
      )}
      <TableCell className="text-slate-700 py-2 px-2 border-r border-gray-100 text-xs">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-slate-500" />
          <span className="truncate">{conduce.numeroCliente}</span>
        </div>
      </TableCell>
      <TableCell className="py-2 px-2 border-r border-gray-100">
        <div className="flex items-center justify-center">
          {conduce.bultoModificado ? (
            <div className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
              <Package className="h-3 w-3" />
              <span>{conduce.cantidadEntregados}/{conduce.cantidadBultos}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs">
              <Package className="h-3 w-3" />
              <span>{conduce.cantidadBultos}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-slate-700 py-2 px-2 border-r border-gray-100 text-xs">
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-slate-500" />
          <span className="truncate">{conduce.razonSocial || '-'}</span>
        </div>
      </TableCell>
      <TableCell className="text-slate-700 py-2 px-2 border-r border-gray-100 text-xs">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-slate-500" />
          <span className="truncate">{conduce.ciudad || '-'}</span>
        </div>
      </TableCell>
      <TableCell className="text-slate-600 py-2 px-2 border-r border-gray-100 font-medium text-xs">
        <span className="truncate">{formatReadableDate(conduce.fechaCarga)}</span>
      </TableCell>
      <TableCell className="text-slate-600 py-2 px-2 border-r border-gray-100 font-medium text-xs">
        <span className="truncate">{formatReadableDate(conduce.fechaEntrega)}</span>
      </TableCell>
      <TableCell className="py-2 px-2 border-r border-gray-100">
        {conduce.estado === 'Entregado' ? (
          conduce.tiempoEntrega ? (
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs">
              <Clock className="h-3 w-3" />
              <span className="truncate">{formatDeliveryTime(conduce.tiempoEntrega)}</span>
            </div>
          ) : (
            <span className="text-slate-500 italic text-xs">N/D</span>
          )
        ) : conduce.estado === 'Devuelto' ? (
          <span className="text-orange-600 font-medium text-xs">No aplica</span>
        ) : (
          <TransitTimeDisplay fechaEntrega={conduce.fechaEntrega} estado={conduce.estado} />
        )}
      </TableCell>
      <TableCell 
        className={`py-2 px-2 ${!isLamUser ? 'border-r border-gray-100' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1 items-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isUpdatingStatus}
                className="cursor-pointer transition-all hover:opacity-95 hover:scale-[1.03] active:scale-[0.97] focus:outline-none rounded-md inline-flex items-center"
                title="Haga clic para poner en tránsito o cambiar estado"
              >
                {isUpdatingStatus ? (
                  <Badge className="bg-slate-500 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Actualizando...</span>
                  </Badge>
                ) : (
                  <StatusBadge estado={conduce.estado} showChevron={true} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 z-50">
              <DropdownMenuLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
                Cambiar Estado
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={conduce.estado === 'En tránsito' || isUpdatingStatus}
                onClick={() => handleStatusChange('En tránsito')}
                className="text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer flex items-center gap-2 py-2"
              >
                <Truck className="h-3.5 w-3.5 text-amber-500" />
                <span>Poner En tránsito</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={conduce.estado === 'Entregado' || isUpdatingStatus}
                onClick={() => handleStatusChange('Entregado')}
                className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer flex items-center gap-2 py-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Marcar Entregado</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={conduce.estado === 'Devuelto' || isUpdatingStatus}
                onClick={() => handleStatusChange('Devuelto')}
                className="text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 cursor-pointer flex items-center gap-2 py-2"
              >
                <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
                <span>Marcar Devuelto</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {conduce.excepcion && (
            <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50 flex items-center gap-1 px-2 py-0.5 text-xs">
              <AlertTriangle className="h-2.5 w-2.5" />
              Excepción
            </Badge>
          )}
          {conduce.estado === 'Entregado' && isConduceDelayed(conduce) && (
            <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50 flex items-center gap-1 px-2 py-0.5 text-xs">
              <AlertTriangle className="h-2.5 w-2.5" />
              Atrasado
            </Badge>
          )}
          {conduce.prioridad && (
            <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50 flex items-center gap-1 px-2 py-0.5 text-xs">
              <Star className="h-2.5 w-2.5" />
              Prioridad
            </Badge>
          )}
        </div>
      </TableCell>
      {!isLamUser && (
        <TableCell className="text-slate-700 py-2 px-2 text-xs">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-slate-500" />
            <span className="truncate">{conduce.encomendado || '-'}</span>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

export default ConducesTableRow;
