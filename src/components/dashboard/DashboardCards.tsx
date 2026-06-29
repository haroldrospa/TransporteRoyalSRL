import { RecentDeliveries } from './RecentDeliveries';
import { TruckStatusCard } from './TruckStatusCard';
import { DelayedDeliveries } from './DelayedDeliveries';

interface DelayedConduce {
  numeroConduce: string;
  razonSocial: string;
  cantidadBultos: number;
  diasAtraso: number;
  encomendado: string | null;
  estado: string;
}

interface RecentDelivery {
  id: string;
  numeroConduce: string;
  razonSocial: string;
  cantidadBultos: number;
  horaEntrega: string;
}

interface DashboardCardsProps {
  camionesStats: {
    truck: string;
    conduces: number;
    bultos: number;
    clientCount: number;
  }[];
  delayedCount: number;
  delayedConduces?: DelayedConduce[];
  recentDeliveries?: RecentDelivery[];
  showDelayed?: boolean;
}

export const DashboardCards = ({ 
  camionesStats, 
  delayedCount, 
  delayedConduces = [], 
  recentDeliveries = [],
  showDelayed = true 
}: DashboardCardsProps) => {
  return (
    <div className={`grid gap-3 sm:gap-4 grid-cols-1 ${showDelayed ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
      <RecentDeliveries recentDeliveries={recentDeliveries} />
      <TruckStatusCard camionesStats={camionesStats} />
      {showDelayed && (
        <DelayedDeliveries delayedCount={delayedCount} delayedConduces={delayedConduces} />
      )}
    </div>
  );
};
