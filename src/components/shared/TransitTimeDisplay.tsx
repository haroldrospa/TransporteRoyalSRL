
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { calculateTransitTime, getTransitTimeClasses } from '@/utils/time/transitTime';

interface TransitTimeDisplayProps {
  fechaEntrega: string;
  estado: string;
}

const TransitTimeDisplay = ({ fechaEntrega, estado }: TransitTimeDisplayProps) => {
  // Solo mostrar tiempo en tránsito para conduces en ese estado
  if (estado !== 'En tránsito') {
    return <span className="text-slate-500 italic">No aplica</span>;
  }

  const transitInfo = calculateTransitTime(fechaEntrega);
  const badgeClasses = getTransitTimeClasses(transitInfo.status);

  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 border ${badgeClasses}`}>
      <Clock className="h-3.5 w-3.5" />
      <span className="font-medium">{transitInfo.displayText}</span>
    </Badge>
  );
};

export default TransitTimeDisplay;
