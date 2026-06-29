
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface ShipmentTableHeaderProps {
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

const ShipmentTableHeader = ({ allSelected, someSelected, onSelectAll }: ShipmentTableHeaderProps) => {
  return (
    <TableHeader className="hidden md:table-header-group">
      <TableRow>
        <TableHead className="w-12 min-w-[48px] shrink-0 px-2 md:px-4 align-middle">
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
            className="h-4 w-4 shrink-0 cursor-pointer"
          />
        </TableHead>
        <TableHead>Conduce</TableHead>
        <TableHead>Ciudad</TableHead>
        <TableHead>Encomendado</TableHead>
        <TableHead>Paquetes</TableHead>
        <TableHead>Usuario</TableHead>
        <TableHead className="hidden sm:table-cell">Fecha</TableHead>
        <TableHead className="text-right">Acción</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ShipmentTableHeader;
