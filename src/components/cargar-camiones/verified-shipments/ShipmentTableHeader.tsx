
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Barcode, MapPin, Truck, Package, User, Clock } from 'lucide-react';

interface ShipmentTableHeaderProps {
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

const ShipmentTableHeader = ({ allSelected, someSelected, onSelectAll }: ShipmentTableHeaderProps) => {
  return (
    <TableHeader className="bg-muted/30 sticky top-0 z-10">
      <TableRow className="border-b border-border/40 hover:bg-transparent">
        <TableHead className="w-8 px-2 py-2 text-center align-middle">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(ref) => {
              if (ref) {
                ref.indeterminate = someSelected && !allSelected;
              }
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            aria-label="Seleccionar todos"
            className="h-3.5 w-3.5 rounded border-border/80 text-royal-blue focus:ring-royal-blue cursor-pointer"
          />
        </TableHead>
        <TableHead className="w-20 px-2 py-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
          Conduce
        </TableHead>
        <TableHead className="px-2 py-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
          Ciudad
        </TableHead>
        <TableHead className="w-16 px-2 py-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wider text-center">
          Camión
        </TableHead>
        <TableHead className="w-14 px-2 py-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wider text-center">
          Bultos
        </TableHead>
        <TableHead className="w-20 px-2 py-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
          Usuario
        </TableHead>
        <TableHead className="w-14 px-2 py-2 font-medium text-[11px] text-muted-foreground uppercase tracking-wider text-right">
          Hora
        </TableHead>
        <TableHead className="w-8 px-1 py-2 text-right">
          <span className="sr-only">Acción</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ShipmentTableHeader;
