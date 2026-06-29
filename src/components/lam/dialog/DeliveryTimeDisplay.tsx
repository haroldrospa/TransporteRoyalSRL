
import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { formatDeliveryTime } from '@/utils/lamUtils';
import { isVisitador } from '@/components/clientes/utils/clienteTypeUtils';

interface DeliveryTimeDisplayProps {
  tiempoEntrega: string | null;
  parseDeliveryTime: (timeStr: string) => number;
  numeroCliente: string;
}

export const DeliveryTimeDisplay = ({ tiempoEntrega, parseDeliveryTime, numeroCliente }: DeliveryTimeDisplayProps) => {
  if (!tiempoEntrega) return null;

  const deliveryTimeHours = parseDeliveryTime(tiempoEntrega);
  const isClienteVisitador = isVisitador(numeroCliente);
  const delayThreshold = isClienteVisitador ? 72 : 36;
  const isDelayed = deliveryTimeHours > 0 && deliveryTimeHours > delayThreshold;

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`text-3xl font-bold tracking-tight flex items-center justify-center ${
        isDelayed ? 'text-destructive' : 'text-royal-blue'
      }`}>
        {formatDeliveryTime(tiempoEntrega)}
      </div>
      {isDelayed && (
        <span className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium border border-destructive/20">
          Atrasado (Límite {delayThreshold}h)
        </span>
      )}
    </div>
  );
};
