
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface ClientesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterField: string;
  onFilterFieldChange: (value: string) => void;
  showAllTypes?: boolean;
  onShowAllTypesChange?: (value: boolean) => void;
}

const ClientesFilters = ({
  searchTerm,
  onSearchChange,
  filterField,
  onFilterFieldChange,
  showAllTypes = true,
  onShowAllTypesChange
}: ClientesFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar clientes y visitadores..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <select
          className="px-3 py-2 rounded-md border"
          value={filterField}
          onChange={(e) => onFilterFieldChange(e.target.value)}
        >
          <option value="all">Todos los campos</option>
          <option value="numeroCliente">Número Cliente</option>
          <option value="tipo">Tipo (Cliente/Visitador)</option>
          <option value="razonSocial">Razón Social</option>
          <option value="ciudad">Ciudad</option>
          <option value="encomendado">Encomendado</option>
          <option value="ruta">Ruta</option>
          <option value="contacto">Contacto</option>
          <option value="zona">Zona</option>
        </select>
      </div>
      
      {onShowAllTypesChange && (
        <Card className="border-2 border-blue-300">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-all-types" 
                checked={showAllTypes}
                onCheckedChange={onShowAllTypesChange}
              />
              <Label htmlFor="show-all-types" className="font-medium text-base">
                Mostrar todos los tipos de clientes (Clientes y Visitadores)
              </Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientesFilters;
