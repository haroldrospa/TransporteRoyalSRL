
import { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody } from '@/components/ui/table';
import ShipmentFilters from './verified-shipments/ShipmentFilters';
import ShipmentTableHeader from './verified-shipments/ShipmentTableHeader';
import ShipmentTableRow from './verified-shipments/ShipmentTableRow';
import EmptyShipmentState from './verified-shipments/EmptyShipmentState';
import { useShipmentTable } from './verified-shipments/useShipmentTable';

interface VerifiedShipment {
  id: string;
  conduce_number: string;
  encomendado: string;
  scan_type: string;
  verified_at: string;
  bulto_sequence?: number;
  ciudad?: string;
}

interface VerifiedShipmentsTableProps {
  shipments: VerifiedShipment[];
  onDeleteShipment: (id: string) => void;
  onDeleteAllShipments: () => void;
  onExportComplete?: () => void;
  isDeleting: string | null;
}

const VerifiedShipmentsTable = ({ 
  shipments, 
  onDeleteShipment,
  onDeleteAllShipments,
  onExportComplete,
  isDeleting
}: VerifiedShipmentsTableProps) => {
  const {
    setSearchTerm,
    setEncomendadoFilter,
    uniqueEncomendados,
    filteredShipments,
    conducesToDisplay
  } = useShipmentTable(shipments);

  const [selectedConduces, setSelectedConduces] = useState<Set<string>>(new Set());

  // Check if all visible conduces are selected
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
      // Delete each selected conduce
      selectedConduces.forEach(conduceNumber => {
        onDeleteShipment(conduceNumber);
      });
      // Clear selection after deletion
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

      <div className="border rounded-md overflow-x-auto bg-white">
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

export default VerifiedShipmentsTable;
