import { Truck, CheckCircle2, Clock } from 'lucide-react';
import { Conduce } from '@/types/conduces';
import { isConduceDelayed } from '@/utils/time/conduceDelay';

interface TableBultosStatsProps {
  conduces: Conduce[];
}

const TableBultosStats = ({ conduces }: TableBultosStatsProps) => {
  const bultosEnTransito = conduces
    .filter(c => c.estado === 'En tránsito')
    .reduce((acc, c) => acc + (c.cantidadBultos || 0), 0);
    
  // Atrasados: delayed normal + exceptions
  const bultosAtrasados = conduces
    .filter(c => c.estado === 'Entregado' && (isConduceDelayed(c) || c.excepcion === true))
    .reduce((acc, c) => acc + (c.cantidadBultos || 0), 0);

  // Entregados: total bultos - en tránsito - atrasados (includes devueltos and any other states to match the total count)
  const bultosTotalCount = conduces.reduce((acc, c) => acc + (c.cantidadBultos || 0), 0);
  const bultosEntregados = Math.max(0, bultosTotalCount - bultosEnTransito - bultosAtrasados);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 py-1.5 bg-white sm:bg-transparent rounded-lg text-xs md:text-sm">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md border border-amber-100/50 text-amber-700">
        <Truck className="h-3.5 w-3.5" />
        <span className="font-bold">{bultosEnTransito}</span>
        <span className="font-medium hidden sm:inline">En tránsito</span>
      </div>
      
      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100/50 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-bold">{bultosEntregados}</span>
        <span className="font-medium hidden sm:inline">Entregados</span>
      </div>

      {bultosAtrasados > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-md border border-rose-100/50 text-rose-700">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-bold">{bultosAtrasados}</span>
          <span className="font-medium hidden sm:inline">Atrasados</span>
        </div>
      )}
    </div>
  );
};

export default TableBultosStats;
