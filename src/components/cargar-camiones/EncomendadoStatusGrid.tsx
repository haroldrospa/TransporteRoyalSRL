
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTrucksByRegion } from '@/utils/trucksByRegion';
import EncomendadoStatusCard from './EncomendadoStatusCard';

interface EncomendadoStatusGridProps {
  encomendadoStats: Record<string, { 
    conduces: number, 
    bultos: number, 
    scannedConduces: number, 
    scannedBultos: number,
    clientCount?: number,
    priorityConduces?: number,
    priorityDetails?: any[]
  }>;
  onEncomendadoClick: (encomendado: string) => void;
}

const EncomendadoStatusGrid = ({ encomendadoStats, onEncomendadoClick }: EncomendadoStatusGridProps) => {
  const { regionActual } = useData();
  const { user } = useAuth();
  
  // Get valid trucks based on current region
  let validTrucks = getTrucksByRegion(regionActual);
  
  // Filter out "Almacen" for LAM users
  if (user?.puesto === 'LAM') {
    validTrucks = validTrucks.filter(truck => truck !== 'Almacen');
  }
  
  // Crear estadísticas filtradas, excluyendo los camiones no válidos y los que tienen 0 conduces y 0 bultos
  const filteredStats: typeof encomendadoStats = {};
  
  Object.entries(encomendadoStats).forEach(([truck, stats]) => {
    if (validTrucks.includes(truck) && (stats.conduces > 0 || stats.bultos > 0)) {
      filteredStats[truck] = stats;
    }
  });
  
  // Solo agregar camiones válidos que tienen conduces o bultos asignados
  validTrucks.forEach(truck => {
    if (!filteredStats[truck] && encomendadoStats[truck]) {
      const stats = encomendadoStats[truck];
      if (stats.conduces > 0 || stats.bultos > 0) {
        filteredStats[truck] = stats;
      }
    }
  });

  // Ordenar entradas para mostrar las activas primero, luego por prioridad, y finalmente por nombre de camión
  const sortedEntries = Object.entries(filteredStats).sort(([truckA, statsA], [truckB, statsB]) => {
    const isActiveA = statsA.conduces > 0;
    const isActiveB = statsB.conduces > 0;
    
    if (isActiveA && !isActiveB) return -1;
    if (!isActiveA && isActiveB) return 1;
    
    // Si ambos están activos, priorizar los que tienen conduces en prioridad
    const hasPriorityA = (statsA.priorityConduces || 0) > 0;
    const hasPriorityB = (statsB.priorityConduces || 0) > 0;
    
    if (hasPriorityA && !hasPriorityB) return -1;
    if (!hasPriorityA && hasPriorityB) return 1;
    
    // Si ambos están activos o inactivos, ordenar por estado de finalización
    const isCompleteA = statsA.scannedConduces === statsA.conduces && statsA.scannedBultos === statsA.bultos;
    const isCompleteB = statsB.scannedConduces === statsB.conduces && statsB.scannedBultos === statsB.bultos;
    const inProgressA = statsA.scannedConduces > 0 || statsA.scannedBultos > 0;
    const inProgressB = statsB.scannedConduces > 0 || statsB.scannedBultos > 0;
    
    if (inProgressA && !inProgressB && !isCompleteA) return -1;
    if (!inProgressA && inProgressB && !isCompleteB) return 1;
    if (isCompleteA && !isCompleteB) return 1;
    if (!isCompleteA && isCompleteB) return -1;
    
    // Ordenar por nombre de camión por defecto
    return truckA.localeCompare(truckB);
  });

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm">
        <p className="text-gray-500">No hay camiones asignados para cargar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
      {sortedEntries.map(([encomendado, stats]) => (
        <EncomendadoStatusCard 
          key={encomendado} 
          encomendado={encomendado} 
          stats={stats}
          onClick={() => onEncomendadoClick(encomendado)}
        />
      ))}
    </div>
  );
};

export default EncomendadoStatusGrid;
