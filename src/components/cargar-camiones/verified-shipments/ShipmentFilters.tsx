
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Trash2 } from 'lucide-react';

interface ShipmentFiltersProps {
  uniqueEncomendados: string[];
  onSearchChange: (term: string) => void;
  onEncomendadoFilterChange: (encomendado: string) => void;
  onDeleteAllShipments: () => void;
  onDeleteSelectedShipments: () => void;
  selectedCount: number;
  onExportComplete?: () => void;
}

const ShipmentFilters = ({ 
  uniqueEncomendados, 
  onSearchChange, 
  onEncomendadoFilterChange, 
  onDeleteAllShipments,
  onDeleteSelectedShipments,
  selectedCount,
  onExportComplete
}: ShipmentFiltersProps) => {
  const handleEncomendadoChange = (value: string) => {
    // Convert "all" back to empty string for the filter logic
    onEncomendadoFilterChange(value === "all" ? "" : value);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      <div className="flex gap-2 items-center flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Filtrar por código"
            className="pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select onValueChange={handleEncomendadoChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los camiones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los camiones</SelectItem>
            {uniqueEncomendados.map((encomendado) => (
              <SelectItem key={encomendado} value={encomendado}>
                {encomendado}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        {onExportComplete && (
          <Button
            onClick={onExportComplete}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Reporte Completo
          </Button>
        )}
        
        {selectedCount > 0 && (
          <Button
            onClick={onDeleteSelectedShipments}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar seleccionados ({selectedCount})
          </Button>
        )}
        
        <Button
          onClick={onDeleteAllShipments}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar todas
        </Button>
      </div>
    </div>
  );
};

export default ShipmentFilters;
