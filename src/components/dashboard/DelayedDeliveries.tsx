import { AlertTriangle, Package, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface DelayedConduce {
  numeroConduce: string;
  razonSocial: string;
  cantidadBultos: number;
  diasAtraso: number;
  encomendado: string | null;
  estado: string;
}

interface DelayedDeliveriesProps {
  delayedCount: number;
  delayedConduces?: DelayedConduce[];
}

export const DelayedDeliveries = ({
  delayedCount,
  delayedConduces = []
}: DelayedDeliveriesProps) => {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground">Conduces Atrasados</h3>
        {delayedCount > 0 && (
          <Badge variant="destructive" className="ml-auto rounded-full text-xs px-2.5 shadow-sm shadow-destructive/20">
            {delayedCount}
          </Badge>
        )}
      </div>
      <div className="px-5 pb-5 space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
        {delayedConduces.map((conduce, i) => (
          <motion.div
            key={conduce.numeroConduce}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 hover:bg-destructive/8 border border-destructive/10 transition-colors text-sm gap-2"
          >
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              <span className="font-semibold text-foreground">{conduce.numeroConduce}</span>
              <span className="text-xs text-muted-foreground truncate">{conduce.razonSocial || 'Sin cliente'}</span>
              {conduce.encomendado && (
                <span className="text-xs text-muted-foreground/70">{conduce.encomendado}</span>
              )}
              <Badge variant={conduce.estado === 'En tránsito' ? 'secondary' : 'outline'} className="text-[10px] w-fit px-1.5 py-0">
                {conduce.estado}
              </Badge>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                <Package className="h-3 w-3" />
                {conduce.cantidadBultos} bultos
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {conduce.diasAtraso} días
              </span>
            </div>
          </motion.div>
        ))}
        {delayedConduces.length === 0 && (
          <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
            <ShieldAlert className="h-8 w-8 opacity-40" />
            <span className="text-sm">No hay conduces atrasados</span>
          </div>
        )}
      </div>
    </div>
  );
};
