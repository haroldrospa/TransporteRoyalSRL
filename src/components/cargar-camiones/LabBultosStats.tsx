import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { Conduce } from '@/types/conduces';

interface LabBultosStatsProps {
  conduces: Conduce[];
}

const LabBultosStats = ({ conduces }: LabBultosStatsProps) => {
  const stats = useMemo(() => {
    const enTransito = conduces.filter(c => c.estado === 'En tránsito');
    const sumBy = (lab: string) =>
      enTransito.filter(c => c.laboratorio === lab).reduce((sum, c) => sum + (c.cantidadBultos || 0), 0);
    const lamBultos = sumBy('LAM');
    const fersuazBultos = sumBy('Fersuaz');
    const taaBultos = sumBy('Taapharmaceutica');
    const innovBultos = sumBy('Innovacion Quimica');
    return { lamBultos, fersuazBultos, taaBultos, innovBultos, total: lamBultos + fersuazBultos + taaBultos + innovBultos };
  }, [conduces]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="flex items-center gap-3 rounded-lg border bg-purple-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">LAM en tránsito</p>
          <p className="text-xl font-bold text-purple-700">{stats.lamBultos}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-teal-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fersuaz en tránsito</p>
          <p className="text-xl font-bold text-teal-700">{stats.fersuazBultos}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-amber-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Taapharma en tránsito</p>
          <p className="text-xl font-bold text-amber-700">{stats.taaBultos}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-green-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Innov. Quimica en tránsito</p>
          <p className="text-xl font-bold text-green-700">{stats.innovBultos}</p>
        </div>
      </div>
    </div>
  );
};

export default LabBultosStats;
