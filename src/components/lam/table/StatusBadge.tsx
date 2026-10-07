
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Truck, RotateCcw, ChevronDown } from 'lucide-react';

interface StatusBadgeProps {
  estado: string;
  showChevron?: boolean;
}

const StatusBadge = ({ estado, showChevron = false }: StatusBadgeProps) => {
  switch (estado) {
    case 'Entregado':
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1 select-none">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Entregado</span>
          {showChevron && <ChevronDown className="h-3 w-3 opacity-80 -mr-0.5" />}
        </Badge>
      );
    case 'En tránsito':
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1 select-none">
          <Truck className="h-3.5 w-3.5" />
          <span>En tránsito</span>
          {showChevron && <ChevronDown className="h-3 w-3 opacity-80 -mr-0.5" />}
        </Badge>
      );
    case 'Devuelto':
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md flex items-center gap-1.5 px-3 py-1 select-none">
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Devuelto</span>
          {showChevron && <ChevronDown className="h-3 w-3 opacity-80 -mr-0.5" />}
        </Badge>
      );
    default:
      return (
        <Badge className="shadow-sm flex items-center gap-1">
          <span>{estado}</span>
          {showChevron && <ChevronDown className="h-3 w-3 opacity-80 -mr-0.5" />}
        </Badge>
      );
  }
};

export default StatusBadge;
