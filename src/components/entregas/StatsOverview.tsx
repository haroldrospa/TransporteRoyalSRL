
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Conduce } from '@/types/conduces';

interface StatsOverviewProps {
  pendingDeliveries: Conduce[];
  completedDeliveries: Conduce[];
  returnedDeliveries: Conduce[];
}

export const StatsOverview = ({ 
  pendingDeliveries, 
  completedDeliveries, 
  returnedDeliveries 
}: StatsOverviewProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Pendientes"
        value={pendingDeliveries.length}
        subtitle={`${pendingDeliveries.filter(d => d.prioridad).length} con prioridad`}
        icon={Package}
        iconColor="text-amber-600"
        bgColor="bg-amber-50"
      />
      
      <StatsCard
        title="Entregados Hoy"
        value={completedDeliveries.length}
        subtitle="Completados satisfactoriamente"
        icon={CheckCircle}
        iconColor="text-green-600"
        bgColor="bg-green-50"
      />
      
      <StatsCard
        title="Devoluciones"
        value={returnedDeliveries.length}
        subtitle="No se pudieron entregar"
        icon={AlertCircle}
        iconColor="text-red-600"
        bgColor="bg-red-50"
      />
    </div>
  );
};
