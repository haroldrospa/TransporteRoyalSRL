
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Building2, MapPin, Clock, Truck, User, FileText, FlaskConical } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConducesTableHeaderProps {
  selectedConduces: string[];
  totalConduces: number;
  onSelectAll: (checked: boolean) => void;
}

const ConducesTableHeader = ({ selectedConduces, totalConduces, onSelectAll }: ConducesTableHeaderProps) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const isAllSelected = selectedConduces.length === totalConduces && totalConduces > 0;
  const isPartiallySelected = selectedConduces.length > 0 && selectedConduces.length < totalConduces;

  useEffect(() => {
    if (checkboxRef.current) {
      const checkboxElement = checkboxRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkboxElement) {
        checkboxElement.indeterminate = isPartiallySelected;
      }
    }
  }, [isPartiallySelected]);

  return (
    <TableHeader>
      <TableRow className="flex md:table-row items-center border-b">
        <TableHead className="w-12 block md:table-cell">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              ref={checkboxRef as any}
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              aria-label="Seleccionar todos"
              className="h-4 w-4 shrink-0 md:h-4 md:w-4 cursor-pointer"
            />
            <span className="sr-only">Seleccionar todos</span>
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            RNC
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            No. Cliente
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Laboratorio
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            No. Conduce
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Razón Social
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ciudad
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Conduces
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bultos
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">Ruta</TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Encomendado
          </div>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tiempo en Tránsito
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ConducesTableHeader;
