import { Truck, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface TruckStatsItem {
  truck: string;
  conduces: number;
  bultos: number;
  clientCount: number;
}

interface TruckStatusCardProps {
  camionesStats: TruckStatsItem[];
}

export const TruckStatusCard = ({ camionesStats }: TruckStatusCardProps) => {
  const { user } = useAuth();
  
  const filteredStats = user?.puesto === 'LAM' 
    ? camionesStats.filter(stat => stat.truck !== 'Almacen')
    : camionesStats;
    
  const activeTrucks = filteredStats.filter(stat => stat.conduces > 0)
    .sort((a, b) => b.bultos - a.bultos);
  
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10">
          <Truck className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Estado de Camiones</h3>
      </div>
      <div className="px-5 pb-5 space-y-2 max-h-[350px] overflow-y-auto scrollbar-hide">
        {activeTrucks.map((stat, i) => (
          <motion.div
            key={stat.truck}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-sm"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">{stat.truck}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {stat.clientCount} {stat.clientCount === 1 ? "cliente" : "clientes"}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
              {stat.bultos} bultos
            </span>
          </motion.div>
        ))}
        {activeTrucks.length === 0 && (
          <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Truck className="h-8 w-8 opacity-40" />
            <span className="text-sm">No hay camiones activos</span>
          </div>
        )}
      </div>
    </div>
  );
};
