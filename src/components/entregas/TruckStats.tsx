
import { Package, Users, FileText } from 'lucide-react';
import { StatsCard } from './StatsCard';

interface TruckStatsProps {
  totalClientes: number;
  totalBultos: number;
  totalConduces: number;
}

export const TruckStats = ({ 
  totalClientes, 
  totalBultos, 
  totalConduces 
}: TruckStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <StatsCard
        title="Total Clientes"
        value={totalClientes}
        subtitle="Clientes únicos asignados"
        icon={Users}
        iconColor="text-blue-600"
        bgColor="bg-blue-50"
      />
      
      <StatsCard
        title="Total Bultos"
        value={totalBultos}
        subtitle="Todos los bultos del camión"
        icon={Package}
        iconColor="text-purple-600"
        bgColor="bg-purple-50"
      />
      
      <StatsCard
        title="Total Conduces"
        value={totalConduces}
        subtitle="Todos los conduces del camión"
        icon={FileText}
        iconColor="text-indigo-600"
        bgColor="bg-indigo-50"
      />
    </div>
  );
};
