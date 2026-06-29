import { Package, Inbox, CheckCircle2, Truck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentDelivery {
  id: string;
  numeroConduce: string;
  razonSocial: string;
  cantidadBultos: number;
  horaEntrega: string;
}

interface RecentDeliveriesProps {
  recentDeliveries?: RecentDelivery[];
}

export const RecentDeliveries = ({ recentDeliveries = [] }: RecentDeliveriesProps) => {
  const [visibleItems, setVisibleItems] = useState<number>(0);

  // Animate items appearing one by one
  useEffect(() => {
    if (recentDeliveries.length === 0) return;
    setVisibleItems(0);
    const interval = setInterval(() => {
      setVisibleItems(prev => {
        if (prev >= recentDeliveries.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [recentDeliveries.length]);

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10">
          <Package className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Entregas Recientes</h3>
        {recentDeliveries.length > 0 && (
          <motion.div 
            className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            En vivo
          </motion.div>
        )}
      </div>
      <div className="px-5 pb-5 space-y-2">
        <AnimatePresence mode="popLayout">
          {recentDeliveries.slice(0, 4).map((delivery, i) => (
            i < visibleItems && (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 25,
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 transition-colors text-sm gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </motion.div>
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="font-semibold text-foreground truncate">{delivery.numeroConduce}</span>
                    <span className="text-xs text-muted-foreground truncate">{delivery.razonSocial}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <motion.span 
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Truck className="h-3 w-3" />
                    {delivery.cantidadBultos} bultos
                  </motion.span>
                  {delivery.horaEntrega && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {(() => {
                        try {
                          const date = new Date(delivery.horaEntrega);
                          return isNaN(date.getTime()) ? delivery.horaEntrega : `hace ${formatDistanceToNow(date, { locale: es })}`;
                        } catch {
                          return delivery.horaEntrega;
                        }
                      })()}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
        {recentDeliveries.length === 0 && (
          <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-40" />
            <span className="text-sm">No hay entregas recientes</span>
          </div>
        )}
      </div>
    </div>
  );
};
