
import React, { useMemo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Package, Clock, MapPin } from 'lucide-react';
import { calculateTransitTime, getTransitTimeClasses } from '@/utils/time/transitTime';
import GroupCheckbox from './GroupCheckbox';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';
import EncomendadoCellSelector from './EncomendadoCellSelector';
import EncomendadoPredeterminadoSelector from './EncomendadoPredeterminadoSelector';

interface ClienteGroup {
  numeroCliente: string;
  allNumeroClientes: string[];
  rnc?: string;
  razonSocial: string;
  ciudad: string;
  totalConduces: number;
  totalBultos: number;
  conduces: any[];
  ruta?: string;
  laboratorio: string;
  encomendadoPredeterminado?: string;
}

interface ClienteGroupRowProps {
  group: ClienteGroup;
  isExpanded: boolean;
  onToggleGroup: () => void;
  isGroupSelected: (group: ClienteGroup) => boolean;
  isGroupPartiallySelected: (group: ClienteGroup) => boolean;
  onToggleGroupSelection: (group: ClienteGroup) => void;
  getGroupRowColorClass: (group: ClienteGroup) => string;
  onAssignComplete?: () => void;
}

const ClienteGroupRow = ({
  group,
  isExpanded,
  onToggleGroup,
  isGroupSelected,
  isGroupPartiallySelected,
  onToggleGroupSelection,
  getGroupRowColorClass,
  onAssignComplete
}: ClienteGroupRowProps) => {
  const { user } = useAuth();
  const isAdmin = isAdministrator(user);
  // Show the worst transit time for the group
  const transitTimes = group.conduces.map(c => calculateTransitTime(c.fechaEntrega));
  const worstTime = transitTimes.reduce((worst, current) => 
    current.totalHours > worst.totalHours ? current : worst
  );
  const encomendados = Array.from(
    new Set(group.conduces.map(c => c.encomendado).filter(Boolean))
  ) as string[];
  const classes = getTransitTimeClasses(worstTime.status);

  const ciudadesList = useMemo(() => {
    const set = new Set<string>();
    if (group.ciudad?.trim()) set.add(group.ciudad.trim());
    if (Array.isArray(group.conduces)) {
      group.conduces.forEach((c: any) => {
        if (c?.ciudad?.trim()) set.add(c.ciudad.trim());
      });
    }
    return Array.from(set);
  }, [group.ciudad, group.conduces]);

  return (
    <TableRow 
      className={`font-medium flex flex-wrap md:table-row items-center border border-gray-200 shadow-sm rounded-xl mb-3 bg-white md:bg-transparent md:p-0 md:mb-0 md:rounded-none md:border-0 md:border-b md:shadow-none hover:bg-gray-50 relative cursor-pointer ${getGroupRowColorClass(group)}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT' && target.closest('button') === null) {
          onToggleGroupSelection(group);
        }
      }}
    >
      <TableCell className="order-1 block md:table-cell w-full md:w-auto p-1.5 px-2 md:p-4 border-b border-gray-100 md:border-0 md:border-b shrink-0 bg-gray-50/80 md:bg-transparent rounded-t-xl md:rounded-none">
        <div className="flex items-center justify-between md:justify-start gap-2 w-full">
          <div className="flex items-center gap-2 py-0.5 px-1">
            <GroupCheckbox
              group={group}
              isGroupSelected={isGroupSelected}
              isGroupPartiallySelected={isGroupPartiallySelected}
              onToggleGroupSelection={onToggleGroupSelection}
            />
            <span className="md:hidden text-xs font-bold text-gray-700">Seleccionar Grupo</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleGroup}
            className="h-6 px-2 md:w-6 md:p-0 md:px-0 flex items-center gap-1 bg-white md:bg-transparent border border-gray-200 md:border-0 shadow-sm md:shadow-none"
          >
            <span className="md:hidden text-[10px] font-semibold text-gray-600">
              {isExpanded ? 'Ocultar' : 'Ver'} detalles
            </span>
            {isExpanded ? 
              <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" /> : 
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" />
            }
          </Button>
        </div>
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{group.rnc || '-'}</TableCell>
      
      <TableCell className="order-4 block md:table-cell w-full md:w-auto p-2 pt-0 md:p-4 border-0 md:border-b text-sm font-medium">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Cliente / RNC</div>
            {group.allNumeroClientes.length > 1 ? (
              <div className="flex flex-col gap-0.5">
                {group.allNumeroClientes.map(nc => (
                  <span key={nc} className="text-[10px] md:text-xs break-all text-gray-500 md:text-gray-900 leading-tight">{nc}</span>
                ))}
              </div>
            ) : <span className="text-[10px] md:text-sm break-all text-gray-500 md:text-gray-900 leading-tight">{group.numeroCliente}</span>}
          </div>

          {/* Encomendado Asignado y Predeterminado en Vista Móvil */}
          <div className="md:hidden flex flex-col items-end gap-1.5">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Asignado</span>
              <EncomendadoCellSelector
                conduceIds={group.conduces.map(c => c.id)}
                currentEncomendado={group.conduces[0]?.encomendado}
                predeterminado={group.encomendadoPredeterminado}
                onAssigned={onAssignComplete}
              />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Predeterminado</span>
              <EncomendadoPredeterminadoSelector
                numeroClientes={group.allNumeroClientes?.length > 0 ? group.allNumeroClientes : [group.numeroCliente]}
                clienteNombre={group.razonSocial}
                currentPredeterminado={group.encomendadoPredeterminado}
                onUpdated={onAssignComplete}
              />
            </div>
          </div>
        </div>
      </TableCell>
      
      {isAdmin && (
        <TableCell className="order-5 block md:table-cell w-full md:w-auto p-2 pt-1 pb-2 md:p-4 border-0 md:border-b">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {group.laboratorio.split(', ').map((lab, i) => (
                <Badge key={i} variant="outline" className={`text-[9px] h-5 px-1.5 md:text-xs md:h-auto md:px-2.5 ${
                  lab === 'LAM' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                  lab === 'Taapharmaceutica' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  lab === 'Innovacion Quimica' ? 'bg-green-50 text-green-700 border-green-200' :
                  lab === 'Fersuaz' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                  (lab === 'Krishpar Care Dominicana' || lab === 'Krishpar care dominicana') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-teal-50 text-teal-700 border-teal-200'
                }`}>
                  {lab === 'Taapharmaceutica' ? 'Taapharma' : 
                   lab === 'Innovacion Quimica' ? 'Innov. Quimica' : 
                   (lab === 'Krishpar Care Dominicana' || lab === 'Krishpar care dominicana') ? 'Krishpar' : 
                   lab}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex items-center gap-1" title="Conduces">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Cond:</span>
                <span className="text-xs font-bold text-gray-700">{group.totalConduces}</span>
              </div>
              <div className="flex items-center gap-1" title="Bultos">
                <Package className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-bold text-gray-700">{group.totalBultos}</span>
              </div>
            </div>
          </div>
        </TableCell>
      )}
      
      <TableCell className="hidden md:table-cell font-semibold text-sm">
        {group.conduces.map(c => c.numeroConduce).join(', ')}
      </TableCell>
      
      <TableCell className="order-2 flex-1 block md:table-cell p-2 pb-0 md:p-4 border-0 md:border-b">
        <span className="font-bold text-royal-blue md:text-foreground text-xs sm:text-sm md:text-base line-clamp-2 leading-tight">
          {group.razonSocial?.trim() || (group.numeroCliente && !group.numeroCliente.startsWith('__sin_asignar__') ? `Cliente #${group.numeroCliente}` : 'Sin Razón Social')}
        </span>
        {ciudadesList.length > 0 && (
          <div className="md:hidden flex items-center gap-1 text-[11px] font-semibold text-slate-600 mt-0.5">
            <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
            <span className="truncate">{ciudadesList.join(' · ')}</span>
          </div>
        )}
      </TableCell>
      
      <TableCell className="hidden md:table-cell font-medium text-slate-700">
        {ciudadesList.length > 0 ? ciudadesList.join(' · ') : (group.ciudad || '-')}
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-center">
        <Badge variant="outline" className="font-medium bg-slate-50 md:bg-transparent">
          {group.totalConduces}
        </Badge>
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-center">
        <div className="flex items-center justify-center gap-1">
          <Package className="h-4 w-4 text-amber-500 md:text-gray-500" />
          <span className="font-bold text-gray-700 md:font-medium md:text-gray-900">{group.totalBultos}</span>
        </div>
      </TableCell>
      
      <TableCell className="hidden md:table-cell">
        {group.ruta ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {group.ruta}
          </Badge>
        ) : '-'}
      </TableCell>
      
      <TableCell className="hidden md:table-cell">
        <EncomendadoCellSelector
          conduceIds={group.conduces.map(c => c.id)}
          currentEncomendado={group.conduces[0]?.encomendado}
          predeterminado={group.encomendadoPredeterminado}
          onAssigned={onAssignComplete}
        />
      </TableCell>
      
      <TableCell className="hidden md:table-cell">
        <EncomendadoPredeterminadoSelector
          numeroClientes={group.allNumeroClientes?.length > 0 ? group.allNumeroClientes : [group.numeroCliente]}
          clienteNombre={group.razonSocial}
          currentPredeterminado={group.encomendadoPredeterminado}
          onUpdated={onAssignComplete}
        />
      </TableCell>
      
      <TableCell className="order-3 block md:table-cell w-auto p-2 pb-0 md:p-4 border-0 md:border-b ml-auto">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-md md:rounded-lg border text-[10px] md:text-sm ${classes}`}>
          <Clock className="h-3 w-3 md:h-4 md:w-4" />
          <span className="font-bold md:font-medium">{worstTime.displayText}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ClienteGroupRow;
