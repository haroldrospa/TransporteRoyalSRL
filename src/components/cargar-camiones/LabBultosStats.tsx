import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { Conduce } from '@/types/conduces';

interface LabBultosStatsProps {
  conduces: Conduce[];
  loading?: boolean;
}

const LabBultosStats = ({ conduces, loading = false }: LabBultosStatsProps) => {
  const stats = useMemo(() => {
    const enTransito = conduces.filter(c => c.estado === 'En tránsito');
    const sumBy = (lab: string) =>
      enTransito.filter(c => c.laboratorio === lab).reduce((sum, c) => sum + (c.cantidadBultos || 0), 0);
    const lamBultos = sumBy('LAM');
    const fersuazBultos = sumBy('Fersuaz');
    const taaBultos = sumBy('Taapharmaceutica');
    const innovBultos = sumBy('Innovacion Quimica');
    const krishparBultos = sumBy('Krishpar Care Dominicana') + sumBy('Krishpar care dominicana');
    return { lamBultos, fersuazBultos, taaBultos, innovBultos, krishparBultos, total: lamBultos + fersuazBultos + taaBultos + innovBultos + krishparBultos };
  }, [conduces]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* LAM */}
      <div className="flex items-center gap-3 rounded-lg border bg-purple-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">LAM en tránsito</p>
          {loading ? (
            <div className="h-6 w-14 bg-purple-200/70 dark:bg-purple-900/50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-bold text-purple-700">{stats.lamBultos}</p>
          )}
        </div>
      </div>

      {/* Fersuaz */}
      <div className="flex items-center gap-3 rounded-lg border bg-teal-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">Fersuaz en tránsito</p>
          {loading ? (
            <div className="h-6 w-14 bg-teal-200/70 dark:bg-teal-900/50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-bold text-teal-700">{stats.fersuazBultos}</p>
          )}
        </div>
      </div>

      {/* Taapharma */}
      <div className="flex items-center gap-3 rounded-lg border bg-amber-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">Taapharma en tránsito</p>
          {loading ? (
            <div className="h-6 w-14 bg-amber-200/70 dark:bg-amber-900/50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-bold text-amber-700">{stats.taaBultos}</p>
          )}
        </div>
      </div>

      {/* Innov. Quimica */}
      <div className="flex items-center gap-3 rounded-lg border bg-green-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">Innov. Química en tránsito</p>
          {loading ? (
            <div className="h-6 w-14 bg-green-200/70 dark:bg-green-900/50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-bold text-green-700">{stats.innovBultos}</p>
          )}
        </div>
      </div>

      {/* Krishpar */}
      <div className="flex items-center gap-3 rounded-lg border bg-rose-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">Krishpar en tránsito</p>
          {loading ? (
            <div className="h-6 w-14 bg-rose-200/70 dark:bg-rose-900/50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-bold text-rose-700">{stats.krishparBultos}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabBultosStats;
