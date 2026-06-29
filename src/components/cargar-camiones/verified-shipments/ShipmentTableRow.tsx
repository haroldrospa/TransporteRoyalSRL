
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, Package, MapPin, Trash, Loader2, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { canDeleteRecords } from '@/utils/userPermissions';

interface ShipmentRowProps {
  shipment: {
    conduce_number: string;
    encomendado: string;
    ciudad?: string;
    verified_at: string;
    packageCount: number;
    totalPackages: number;
    user_name?: string;
    isVerified: boolean;
  };
  isSelected: boolean;
  onSelect: (conduceNumber: string, checked: boolean) => void;
  onDelete: (conduceNumber: string) => void;
  isDeleting: string | null;
}

const ShipmentTableRow = ({ shipment, isSelected, onSelect, onDelete, isDeleting }: ShipmentRowProps) => {
  const { user } = useAuth();
  const userCanDelete = canDeleteRecords(user);
  
  // Handle delete click with confirmation
  const handleDeleteClick = () => {
    if (window.confirm(`¿Está seguro que desea eliminar el conduce ${shipment.conduce_number}?`)) {
      onDelete(shipment.conduce_number);
    }
  };

  const isCurrentlyDeleting = isDeleting === shipment.conduce_number;

  return (
    <TableRow 
      key={shipment.conduce_number} 
      className={`flex flex-wrap items-center md:table-row bg-white mb-1.5 rounded-lg border border-gray-200 shadow-sm md:mb-0 md:rounded-none md:border-0 md:border-b md:shadow-none hover:bg-gray-50 relative overflow-hidden transition-all ${isCurrentlyDeleting ? 'opacity-50' : ''} ${isSelected ? 'ring-1 ring-blue-400 bg-blue-50/40 md:ring-0 md:bg-blue-50' : ''}`}
    >
      <TableCell className="w-12 min-w-[48px] shrink-0 px-2 md:px-4 align-middle border-0 md:border-b">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(shipment.conduce_number, e.target.checked)}
          aria-label={`Seleccionar conduce ${shipment.conduce_number}`}
          className="h-4 w-4 cursor-pointer"
        />
      </TableCell>
      <TableCell className="block md:table-cell flex-1 font-medium px-1 py-1.5 md:p-4 border-0">
        <div className="flex items-center gap-1">
          <div className="text-gray-400 font-mono text-xs hidden md:block">|||</div>
          <span className="text-base md:text-sm font-bold md:font-medium text-royal-blue md:text-foreground tracking-tight">{shipment.conduce_number}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell py-0.5 md:py-4 border-b-0 md:border-b">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-500" />
          <span className="text-sm font-normal">{shipment.ciudad || "No disponible"}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell py-0.5 md:py-4 border-b-0 md:border-b">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-gray-500" />
          <span className="text-sm">{shipment.encomendado}</span>
        </div>
      </TableCell>
      <TableCell className="w-1/3 md:w-auto px-1 py-1 pb-1.5 md:p-4 block md:table-cell align-middle border-0 md:border-b">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-0 md:gap-1">
          <span className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5 w-full text-center">Bultos</span>
          <div className="flex items-center justify-center md:justify-start gap-1 md:gap-2 w-full text-center md:text-left">
            <Package size={14} className="text-gray-400 hidden md:block" />
            <span className="text-[13px] md:text-sm font-bold text-gray-800 leading-none">{shipment.packageCount}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-1/3 md:w-auto px-1 py-1 pb-1.5 md:p-4 block md:table-cell align-middle border-0 md:border-b">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-0 md:gap-1">
          <span className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5 w-full text-center">Usuario</span>
          <span className="text-[11px] md:text-sm text-gray-600 truncate max-w-full px-1 leading-none text-center md:text-left">{shipment.user_name?.split(' ')[0] || "No reg."}</span>
        </div>
      </TableCell>
      <TableCell className="hidden sm:block md:table-cell w-1/3 md:w-auto px-1 py-1 pb-1.5 md:p-4 align-middle border-0 md:border-b">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-0 md:gap-1">
          <span className="md:hidden text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5 w-full text-center">Hora</span>
          <span className="text-[11px] md:text-sm text-gray-500 font-medium leading-none text-center md:text-left">{new Date(shipment.verified_at).toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </TableCell>
      <TableCell className="block md:table-cell absolute top-1.5 right-1.5 md:relative md:top-auto md:right-auto p-0 md:p-4 w-auto border-0 md:border-b text-right">
        {userCanDelete ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isCurrentlyDeleting}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 bg-gray-50 md:bg-transparent rounded-full md:rounded-md border border-gray-100 md:border-0"
          >
            {isCurrentlyDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span className="sr-only">Eliminar</span>
          </Button>
        ) : (
          <div className="flex items-center justify-center h-8 w-8">
            <Shield size={14} className="text-gray-300" />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export default ShipmentTableRow;
