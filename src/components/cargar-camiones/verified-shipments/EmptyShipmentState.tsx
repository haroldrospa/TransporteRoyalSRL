
import { Clipboard } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';

const EmptyShipmentState = () => {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-32">
        <div className="flex flex-col items-center justify-center text-center p-4">
          <Clipboard className="h-8 w-8 text-gray-300 mb-2" />
          <h3 className="text-gray-500 font-medium">No hay conduces verificados</h3>
          <p className="text-gray-400 text-sm">Los conduces escaneados aparecerán aquí</p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default EmptyShipmentState;
