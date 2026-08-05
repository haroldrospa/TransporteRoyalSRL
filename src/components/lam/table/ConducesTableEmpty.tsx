
import { TableRow, TableCell } from '@/components/ui/table';
import { Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';

interface ConducesTableEmptyProps {
  isLamUser: boolean;
}

const ConducesTableEmpty = ({ isLamUser }: ConducesTableEmptyProps) => {
  const { user } = useAuth();
  const isAdmin = isAdministrator(user);
  const totalCols = (isLamUser ? 10 : 11) + (isAdmin ? 0 : -1);

  return (
    <TableRow>
      <TableCell colSpan={totalCols} className="text-center py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-medium">No se encontraron conduces</p>
            <p className="text-slate-500 text-sm">con los filtros seleccionados</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ConducesTableEmpty;
