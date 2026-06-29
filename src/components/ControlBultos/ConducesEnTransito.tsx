
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import ConducesFilterBar from './ConducesFilterBar';
import ConducesTable from './ConducesTableByCliente';
import ConducesLoading from './ConducesLoading';
import { useConduceFilters } from '@/hooks/useConduceFilters';
import { useState, useMemo } from 'react';
import { calculateTransitTime } from '@/utils/time/transitTime';

interface ConducesEnTransitoProps {
  conduces: Conduce[];
  loading: boolean;
  selectedConduces: string[];
  toggleSelection: (conduceId: string) => void;
  setSelectedConduces: (ids: string[]) => void;
  clientes?: Cliente[];
  holidaysCacheVersion?: number;
}

const ConducesEnTransito = ({
  conduces,
  loading,
  selectedConduces,
  toggleSelection,
  setSelectedConduces,
  clientes,
  holidaysCacheVersion = 0
}: ConducesEnTransitoProps) => {
  // Debug logging
  console.log('ConducesEnTransito - Total conduces:', conduces.length);
  console.log('ConducesEnTransito - Loading state:', loading);
  if (conduces.length > 0) {
    console.log('ConducesEnTransito - First conduce sample:', conduces[0]);
    console.log('ConducesEnTransito - Estados únicos:', [...new Set(conduces.map(c => c.estado))]);
  }
  
  // Only get conduces that are in transit
  const transitConduces = conduces.filter(c => c.estado === 'En tránsito');
  console.log('ConducesEnTransito - Transit conduces found:', transitConduces.length);
  
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
  } = useConduceFilters(transitConduces);

  // Apply assignment filter and sort by transit time
  const displayedConduces = useMemo(() => {
    let filtered = filteredConduces.filter(conduce => {
      if (assignmentFilter === 'all') return true;
      if (assignmentFilter === 'assigned') return !!conduce.encomendado;
      if (assignmentFilter === 'unassigned') return !conduce.encomendado;
      return true;
    });

    // Sort by transit time (longest first)
    return filtered.sort((a, b) => {
      const transitTimeA = calculateTransitTime(a.fechaEntrega);
      const transitTimeB = calculateTransitTime(b.fechaEntrega);
      
      // Sort by total hours in descending order (longest time first)
      return transitTimeB.totalHours - transitTimeA.totalHours;
    });
  }, [filteredConduces, assignmentFilter, holidaysCacheVersion]);

  // Create a handler that also clears selections
  const handleClearFilters = () => {
    clearFilters();
    setAssignmentFilter('all');
    setLabFilter('all');
    setSelectedConduces([]);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Conduces en Tránsito</CardTitle>
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
        ) : (
          <ConducesTable
            conduces={displayedConduces}
            selectedConduces={selectedConduces}
            toggleSelection={toggleSelection}
            setSelectedConduces={setSelectedConduces}
            clientes={clientes}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ConducesEnTransito;
