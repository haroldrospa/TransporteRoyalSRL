import { TruckDeliveryCard } from './TruckDeliveryCard';
import { TruckDeliveryStats } from '@/hooks/useTruckDeliveryStats';
import { getTrucksByRegion } from '@/utils/trucksByRegion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Region } from '@/types/conduces';

interface TruckDeliveryGridProps {
  truckStats: Record<string, TruckDeliveryStats>;
}

export const TruckDeliveryGrid = ({ truckStats }: TruckDeliveryGridProps) => {
  const { regionActual } = useData();
  const { user } = useAuth();

  // Obtener camiones válidos para la región actual
  const validTrucks = getTrucksByRegion(regionActual as Region);
  
  // Filtrar Almacen si el usuario es LAM
  const filteredTrucks = user?.puesto === 'LAM' 
    ? validTrucks.filter(truck => truck !== 'Almacen')
    : validTrucks;

  // Filtrar solo camiones con conduces asignados
  const trucksWithConduces = Object.entries(truckStats)
    .filter(([truck]) => filteredTrucks.includes(truck))
    .filter(([_, stats]) => stats.conduces > 0);

  // Ordenar por nombre de camión
  const sortedTrucks = trucksWithConduces.sort((a, b) => a[0].localeCompare(b[0]));

  if (sortedTrucks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay entregas pendientes asignadas a camiones en esta región
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedTrucks.map(([truckName, stats]) => (
        <TruckDeliveryCard
          key={truckName}
          truckName={truckName}
          stats={stats}
        />
      ))}
    </div>
  );
};
