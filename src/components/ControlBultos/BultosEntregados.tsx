import { Conduce } from '@/types/conduces';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import ConducesFilterBar from './ConducesFilterBar';
import ConducesTable from './ConducesTableByCliente';
import ConducesLoading from './ConducesLoading';
import { useConduceFilters } from '@/hooks/useConduceFilters';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface BultosEntregadosProps {
  conduces: Conduce[];
  loading: boolean;
}

const BultosEntregados = ({
  conduces,
  loading
}: BultosEntregadosProps) => {
  // Only get conduces that are delivered
  const entregadosConduces = conduces.filter(c => c.estado === 'Entregado');
  
  // Calculate total bultos delivered
  const totalBultosEntregados = entregadosConduces.reduce((total, conduce) => {
    return total + (conduce.cantidadEntregados || conduce.cantidadBultos);
  }, 0);
  
  // State for assignment filter
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  
  // Use our custom hook for filtering
  const {
    searchTerm,
    setSearchTerm,
    filterField,
    setFilterField,
    routeFilter,
    setRouteFilter,
    truckFilter,
    setTruckFilter,
    labFilter,
    setLabFilter,
    filteredConduces,
    uniqueRoutes,
    uniqueTrucks,
    uniqueLabs,
    clearFilters
  } = useConduceFilters(entregadosConduces);

  // Apply assignment filter and sort by delivery date
  const displayedConduces = useMemo(() => {
    let filtered = filteredConduces.filter(conduce => {
      if (assignmentFilter === 'all') return true;
      if (assignmentFilter === 'assigned') return !!conduce.encomendado;
      if (assignmentFilter === 'unassigned') return !conduce.encomendado;
      return true;
    });

    // Sort by delivery date (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.fechaEntrega);
      const dateB = new Date(b.fechaEntrega);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredConduces, assignmentFilter]);

  // Create a handler that clears all filters
  const handleClearFilters = () => {
    clearFilters();
    setAssignmentFilter('all');
    setLabFilter('all');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Bultos Entregados
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-600">
              {entregadosConduces.length} conduces
            </Badge>
            <Badge variant="default" className="bg-emerald-600">
              {totalBultosEntregados} bultos
            </Badge>
          </div>
        </div>
        <ConducesFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterField={filterField}
          setFilterField={setFilterField}
          routeFilter={routeFilter}
          setRouteFilter={setRouteFilter}
          assignmentFilter={assignmentFilter}
          setAssignmentFilter={setAssignmentFilter}
          truckFilter={truckFilter}
          setTruckFilter={setTruckFilter}
          labFilter={labFilter}
          setLabFilter={setLabFilter}
          uniqueRoutes={uniqueRoutes}
          uniqueTrucks={uniqueTrucks}
          uniqueLabs={uniqueLabs}
          clearFilters={handleClearFilters}
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <ConducesLoading />
        ) : displayedConduces.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay bultos entregados
          </div>
        ) : (
          <ConducesTable
            conduces={displayedConduces}
            selectedConduces={[]} // No selection needed for delivered conduces
            toggleSelection={() => {}} // No selection functionality needed
            setSelectedConduces={() => {}} // No selection functionality needed
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BultosEntregados;