import { Package, Truck, CheckCircle2 } from 'lucide-react';
import { Conduce } from '@/types/conduces';

interface TableBultosStatsProps {
  conduces: Conduce[];
}

const TableBultosStats = ({ conduces }: TableBultosStatsProps) => {
  const bultosEnTransito = conduces
    .filter(c => c.estado === 'En tránsito')
    .reduce((acc, c) => acc + (c.cantidadBultos || 0), 0);
    
  const bultosEntregados = conduces
    .filter(c => c.estado === 'Entregado')
    .reduce((acc, c) => acc + (c.cantidadBultos || 0), 0);

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
    </div>
  );
};

export default TableBultosStats;
