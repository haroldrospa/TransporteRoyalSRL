
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Conduce } from '@/types/conduces';
import { isConduceDelayed } from '@/utils/time';
import { formatDeliveryTime } from '@/utils/lamUtils';
import { Package, Edit, Clock, FileText, User, Building2, MapPin, Truck, AlertTriangle, Star, FlaskConical } from 'lucide-react';
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
      <TableCell 
        className="text-slate-700 py-2 px-2 border-r border-gray-100 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {isAdmin ? (
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
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="text-[10px] font-semibold">
            {conduce.laboratorio || '-'}
          </Badge>
        )}
      </TableCell>
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
      <TableCell className={`py-2 px-2 ${!isLamUser ? 'border-r border-gray-100' : ''}`}>
        <div className="flex flex-col gap-1">
          <StatusBadge estado={conduce.estado} />
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
