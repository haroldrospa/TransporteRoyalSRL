
import { TableCell, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

const EmptyClienteTableRow = () => {
  return (
    <TableRow>
      <TableCell colSpan={10} className="text-center h-24">
        <div className="flex flex-col items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No se encontraron clientes</p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default EmptyClienteTableRow;
