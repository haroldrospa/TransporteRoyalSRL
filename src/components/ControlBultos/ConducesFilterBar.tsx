
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, FlaskConical } from 'lucide-react';

interface ConducesFilterBarProps {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  filterField: string;
  setFilterField: Dispatch<SetStateAction<string>>;
  routeFilter: string;
  setRouteFilter: Dispatch<SetStateAction<string>>;
  assignmentFilter: string;
  setAssignmentFilter: Dispatch<SetStateAction<string>>;
  truckFilter: string;
  setTruckFilter: Dispatch<SetStateAction<string>>;
  labFilter: string;
  setLabFilter: Dispatch<SetStateAction<string>>;
  uniqueRoutes: string[];
  uniqueTrucks: string[];
  uniqueLabs: string[];
  clearFilters: () => void;
}

const ConducesFilterBar = ({
  searchTerm,
  setSearchTerm,
  filterField,
  setFilterField,
  routeFilter,
  setRouteFilter,
  assignmentFilter,
  setAssignmentFilter,
  truckFilter,
  setTruckFilter,
  labFilter,
  setLabFilter,
  uniqueRoutes,
  uniqueTrucks,
  uniqueLabs,
  clearFilters
}: ConducesFilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <div className="relative grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar conduces..."
          className="w-full pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <select
        className="px-3 py-2 rounded-md border bg-background text-sm"
        value={filterField}
        onChange={(e) => setFilterField(e.target.value)}
      >
        <option value="all">Todos los campos</option>
        <option value="numeroConduce">Número Conduce</option>
        <option value="numeroFactura">Número Factura</option>
        <option value="numeroCliente">Número Cliente</option>
        <option value="razonSocial">Razón Social</option>
        <option value="ciudad">Ciudad</option>
        <option value="encomendado">Encomendado</option>
      </select>

      <select
        className="px-3 py-2 rounded-md border bg-background text-sm"
        value={labFilter}
        onChange={(e) => setLabFilter(e.target.value)}
      >
        <option value="all">Todos los laboratorios</option>
        {uniqueLabs.map(lab => (
          <option key={lab} value={lab}>{lab}</option>
        ))}
      </select>

      <select
        className="px-3 py-2 rounded-md border bg-background text-sm"
        value={routeFilter}
        onChange={(e) => setRouteFilter(e.target.value)}
      >
        <option value="all">Todas las rutas</option>
        {uniqueRoutes.map(route => (
          <option key={route} value={route}>Ruta {route}</option>
        ))}
      </select>
      
      <select
        className="px-3 py-2 rounded-md border bg-background text-sm"
        value={assignmentFilter}
        onChange={(e) => setAssignmentFilter(e.target.value)}
      >
        <option value="all">Todos</option>
        <option value="assigned">Asignados</option>
        <option value="unassigned">Sin asignar</option>
      </select>

      <select
        className="px-3 py-2 rounded-md border bg-background text-sm"
        value={truckFilter}
        onChange={(e) => setTruckFilter(e.target.value)}
      >
        <option value="all">Todos los camiones</option>
        {uniqueTrucks.map(truck => (
          <option key={truck} value={truck}>{truck}</option>
        ))}
      </select>
      
      <Button variant="outline" onClick={clearFilters} className="flex items-center gap-1">
        <FilterX className="h-4 w-4" />
        Limpiar
      </Button>
    </div>
  );
};

export default ConducesFilterBar;
