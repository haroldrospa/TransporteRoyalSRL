
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Clock } from 'lucide-react';
import { Conduce } from '@/types/conduces';
import { calculateTransitTime, getTransitTimeClasses } from '@/utils/time/transitTime';

interface ConduceRowProps {
  conduce: Conduce;
  isSelected: boolean;
  onToggleSelection: () => void;
  getRowColorClass: (conduce: Conduce) => string;
}

const ConduceRow = ({ conduce, isSelected, onToggleSelection, getRowColorClass }: ConduceRowProps) => {
  const transitInfo = calculateTransitTime(conduce.fechaEntrega);
  const classes = getTransitTimeClasses(transitInfo.status);

  return (
    <TableRow 
      className={`flex flex-wrap md:table-row items-center border border-gray-100 shadow-sm rounded-lg mb-1 mx-2 md:mx-0 p-1 bg-white md:bg-transparent md:p-0 md:mb-0 md:rounded-none md:border-0 md:border-b md:shadow-none hover:bg-gray-50 relative cursor-pointer ${getRowColorClass(conduce)} transition-colors`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && target.closest('button') === null) {
          onToggleSelection();
        }
      }}
    >
      <TableCell className="order-1 block md:table-cell w-auto p-1.5 md:p-4 border-0 md:border-b shrink-0 pl-2 md:pl-8">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
          className="h-4 w-4 md:h-4 md:w-4"
        />
      </TableCell>
      
      <TableCell className="hidden md:table-cell"></TableCell>
      <TableCell className="hidden md:table-cell"></TableCell>
      
      <TableCell className="order-2 block md:table-cell flex-1 p-1.5 md:p-4 border-0 md:border-b">
        <div className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">No. Conduce</div>
        <span className="font-mono font-bold text-xs md:text-sm text-gray-900">{conduce.numeroConduce}</span>
      </TableCell>
      
      <TableCell className="order-4 block md:table-cell w-1/2 md:w-auto p-1.5 md:p-4 border-0 md:border-b">
        <div className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Factura</div>
        <span className="text-xs md:text-sm text-gray-600 font-medium">{conduce.numeroFactura}</span>
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-sm">{conduce.fechaCarga}</TableCell>
      
      <TableCell className="hidden md:table-cell text-center">1</TableCell>
      
      <TableCell className="order-5 block md:table-cell w-1/2 md:w-auto p-1.5 md:p-4 border-0 md:border-b text-center md:text-left">
        <div className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Bultos</div>
        <div className="flex items-center justify-center md:justify-start gap-1">
          <Package className="h-3 w-3 text-gray-500" />
          <span className="text-xs md:text-sm font-bold md:font-normal">{conduce.cantidadBultos}</span>
        </div>
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-sm">{conduce.fechaEntrega}</TableCell>
      
      <TableCell className="order-6 block md:table-cell w-full md:w-auto p-1.5 pt-0 md:p-4 border-0 md:border-b">
        {conduce.prioridad && (
          <Badge variant="outline" className="text-red-600 border-red-400 text-[10px] h-4">
            Prioridad
          </Badge>
        )}
      </TableCell>
      
      <TableCell className="hidden md:table-cell"></TableCell>
      
      <TableCell className="order-3 block md:table-cell w-auto p-1.5 md:p-4 border-0 md:border-b ml-auto">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] md:text-xs font-bold md:font-medium ${classes}`}>
          <Clock className="h-3 w-3 md:h-3 md:w-3" />
          <span>{transitInfo.displayText}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ConduceRow;
