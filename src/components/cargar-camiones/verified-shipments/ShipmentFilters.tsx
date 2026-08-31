
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Trash2, Truck, X } from 'lucide-react';
import { useState } from 'react';

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
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (val: string) => {
    setSearchValue(val);
    onSearchChange(val);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearchChange('');
  };

  const handleEncomendadoChange = (value: string) => {
    onEncomendadoFilterChange(value === "all" ? "" : value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between pb-1">
      <div className="flex flex-wrap gap-2 items-center flex-1">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar código..."
            className="pl-8 pr-7 h-8 text-xs bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/60 rounded-lg"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchValue && (
            <button 
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <Select onValueChange={handleEncomendadoChange}>
          <SelectTrigger className="w-[145px] h-8 text-xs bg-muted/30 hover:bg-muted/50 border-border/60 rounded-lg">
            <SelectValue placeholder="Camión: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos los camiones</SelectItem>
            {uniqueEncomendados.map((encomendado) => (
              <SelectItem key={encomendado} value={encomendado} className="text-xs font-medium">
                {encomendado}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-1.5 justify-end">
        {onExportComplete && (
          <Button
            onClick={onExportComplete}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-royal-blue" />
            Exportar
          </Button>
        )}
        
        {selectedCount > 0 && (
          <Button
            onClick={onDeleteSelectedShipments}
            variant="destructive"
            size="sm"
            className="h-8 text-xs font-medium px-2.5 shadow-sm"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar ({selectedCount})
          </Button>
        )}
        
        <Button
          onClick={onDeleteAllShipments}
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Eliminar todo
        </Button>
      </div>
    </div>
  );
};

export default ShipmentFilters;
