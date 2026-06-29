
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Truck, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  estado: string;
}

const StatusBadge = ({ estado }: StatusBadgeProps) => {
  switch (estado) {
    case 'Entregado':
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Entregado
        </Badge>
      );
    case 'En tránsito':
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1">
          <Truck className="h-3.5 w-3.5" />
          En tránsito
        </Badge>
      );
    case 'Devuelto':
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1">
          <RotateCcw className="h-3.5 w-3.5" />
          Devuelto
        </Badge>
      );
    default:
      return <Badge className="shadow-sm">{estado}</Badge>;
  }
};

export default StatusBadge;
