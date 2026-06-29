
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useState } from 'react';
import { ClienteGroup } from './hooks/useClienteGrouping';
import ConduceDetailsTable from './ConduceDetailsTable';
import TransitTimeDisplay from '@/components/shared/TransitTimeDisplay';

interface ClienteGroupRowProps {
  group: ClienteGroup;
  areAllClienteConducesSelected: (clienteConduces: string[]) => boolean;
  toggleClienteSelection: (clienteConduces: string[]) => void;
  selectedConduces: string[];
  toggleSelection: (conduceId: string) => void;
}

const ClienteGroupRow = ({
  group,
  areAllClienteConducesSelected,
  toggleClienteSelection,
  selectedConduces,
  toggleSelection,
}: ClienteGroupRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const clienteConduces = group.conduces.map(c => c.id);

  // Get the earliest delivery date from the group for transit time calculation
  const earliestDeliveryDate = group.conduces.reduce((earliest, conduce) => {
    return !earliest || conduce.fechaEntrega < earliest ? conduce.fechaEntrega : earliest;
  }, '');

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell>
          <Checkbox 
            checked={areAllClienteConducesSelected(clienteConduces)}
            onCheckedChange={() => toggleClienteSelection(clienteConduces)}
          />
        </TableCell>
        <TableCell className="font-medium">{group.cliente}</TableCell>
        <TableCell>{group.razonSocial}</TableCell>
        <TableCell>{group.ciudad}</TableCell>
        <TableCell>{group.totalConduces}</TableCell>
        <TableCell>{group.totalBultos}</TableCell>
        <TableCell>
          {group.ruta ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Ruta {group.ruta}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {group.encomendado ? (
            <Badge className="bg-blue-500">{group.encomendado}</Badge>
          ) : (
            <span className="text-muted-foreground">Sin asignar</span>
          )}
        </TableCell>
        <TableCell>
          <TransitTimeDisplay 
            fechaEntrega={earliestDeliveryDate}
            estado="En tránsito"
          />
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {isExpanded ? 'Ocultar' : 'Ver'} detalles
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={10} className="p-0">
            <ConduceDetailsTable 
              conduces={group.conduces}
              selectedConduces={selectedConduces}
              toggleSelection={toggleSelection}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ClienteGroupRow;
