
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Conduce } from '@/types/conduces';
import { isVisitador } from '@/components/clientes/utils/clienteTypeUtils';

interface ConduceDetailsDialogHeaderProps {
  conduce: Conduce;
  parseDeliveryTime: (timeStr: string) => number;
}

export const ConduceDetailsDialogHeader = ({ 
  conduce,
  parseDeliveryTime
}: ConduceDetailsDialogHeaderProps) => {
  const deliveryTimeHours = conduce.tiempoEntrega ? parseDeliveryTime(conduce.tiempoEntrega) : 0;
  const isClienteVisitador = isVisitador(conduce.numeroCliente);
  const delayThreshold = isClienteVisitador ? 72 : 36;
  const isDelayed = deliveryTimeHours > 0 && deliveryTimeHours > delayThreshold;
  
  return (
    <DialogHeader className="p-5 bg-royal-blue rounded-t-xl relative overflow-hidden shadow-sm">
      <div className="absolute inset-0 bg-black/10"></div> {/* Subtle overlay for better text contrast on the yellow side */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl shadow-inner border border-white/20 backdrop-blur-md">
            <Package className="h-5 w-5 text-yellow-300" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
              Conduce {conduce.numeroConduce}
            </DialogTitle>
            {conduce.razonSocial && (
              <p className="text-xs text-blue-100 mt-0.5 font-medium drop-shadow-sm">{conduce.razonSocial}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {conduce.excepcion && (
            <Badge variant="destructive" className="h-7 px-3 text-xs font-semibold shadow-sm">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Excepción
            </Badge>
          )}
          {conduce.estado === 'Entregado' && !conduce.excepcion && (
            conduce.tiempoEntrega && isDelayed ? (
              <Badge variant="destructive" className="h-7 px-3 text-xs font-semibold shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Atrasada
              </Badge>
            ) : (
              <Badge className="h-7 px-3 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-100">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Completado
              </Badge>
            )
          )}
          {conduce.estado === 'Devuelto' && (
            <Badge variant="destructive" className="h-7 px-3 text-xs font-semibold shadow-sm">
              Devuelto
            </Badge>
          )}
        </div>
      </div>
    </DialogHeader>
  );
};
