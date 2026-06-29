import { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody } from '@/components/ui/table';
import ShipmentFilters from './ShipmentFilters';
import ShipmentTableHeader from './ShipmentTableHeader';
import ShipmentTableRow from './ShipmentTableRow';
import EmptyShipmentState from './EmptyShipmentState';
import { useShipmentTable } from './useShipmentTable';

interface VerifiedShipment {
  id: string;
  conduce_number: string;
  encomendado: string;
  scan_type: string;
  verified_at: string;
  bulto_sequence?: number;
  ciudad?: string;
}

interface ConducesVerificadosTableProps {
  shipments: VerifiedShipment[];
  onDeleteShipment: (id: string) => void;
  onDeleteAllShipments: () => void;
  onExportComplete?: () => void;
  isDeleting: string | null;
}

const ConducesVerificadosTable = ({ 
  shipments, 
  onDeleteShipment,
  onDeleteAllShipments,
  onExportComplete,
  isDeleting
}: ConducesVerificadosTableProps) => {
  // Filtrar solo conduces (scan_type === 'conduce')
  const conduceShipments = shipments.filter(shipment => shipment.scan_type === 'conduce');
  
  const {
    setSearchTerm,
    setEncomendadoFilter,
    uniqueEncomendados,
    filteredShipments,
    conducesToDisplay
  } = useShipmentTable(conduceShipments);

  const [selectedConduces, setSelectedConduces] = useState<Set<string>>(new Set());

  const allSelected = useMemo(() => {
    if (conducesToDisplay.length === 0) return false;
    return conducesToDisplay.every(s => selectedConduces.has(s.conduce_number));
  }, [conducesToDisplay, selectedConduces]);

  const someSelected = selectedConduces.size > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allConduceNumbers = new Set(conducesToDisplay.map(s => s.conduce_number));
      setSelectedConduces(allConduceNumbers);
    } else {
      setSelectedConduces(new Set());
    }
  };

  const handleSelectOne = (conduceNumber: string, checked: boolean) => {
    setSelectedConduces(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(conduceNumber);
      } else {
        newSet.delete(conduceNumber);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedConduces.size === 0) return;
    
    const count = selectedConduces.size;
    if (window.confirm(`¿Está seguro que desea eliminar ${count} conduce(s) seleccionado(s)?`)) {
      selectedConduces.forEach(conduceNumber => {
        onDeleteShipment(conduceNumber);
      });
      setSelectedConduces(new Set());
    }
  };

  return (
    <div className="space-y-4">
      <ShipmentFilters 
        uniqueEncomendados={uniqueEncomendados}
        onSearchChange={setSearchTerm}
        onEncomendadoFilterChange={setEncomendadoFilter}
        onDeleteAllShipments={onDeleteAllShipments}
        onDeleteSelectedShipments={handleDeleteSelected}
        selectedCount={selectedConduces.size}
        onExportComplete={onExportComplete}
      />

      <div className="border rounded-md overflow-hidden bg-white">
        <Table>
          <ShipmentTableHeader 
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={handleSelectAll}
          />
          <TableBody>
            {conducesToDisplay.length > 0 ? (
              conducesToDisplay.map((shipment) => (
                <ShipmentTableRow 
                  key={shipment.conduce_number} 
                  shipment={shipment}
                  isSelected={selectedConduces.has(shipment.conduce_number)}
                  onSelect={handleSelectOne}
                  onDelete={onDeleteShipment}
                  isDeleting={isDeleting}
                />
              ))
            ) : (
              <EmptyShipmentState />
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredShipments.length > 0 && conducesToDisplay.length === 0 && (
        <Alert>
          <AlertDescription>
            No se encontraron resultados con los filtros actuales.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ConducesVerificadosTable;
