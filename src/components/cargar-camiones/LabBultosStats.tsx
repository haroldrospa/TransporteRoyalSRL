import { useMemo } from 'react';
import { Package, Layers } from 'lucide-react';
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
    const total = lamBultos + fersuazBultos + taaBultos + innovBultos + krishparBultos;
    return { lamBultos, fersuazBultos, taaBultos, innovBultos, krishparBultos, total };
  }, [conduces]);

  const labs = [
    { name: 'LAM', count: stats.lamBultos, dotColor: 'bg-purple-500', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200/80 dark:border-purple-900/60' },
    { name: 'Fersuaz', count: stats.fersuazBultos, dotColor: 'bg-teal-500', textColor: 'text-teal-700 dark:text-teal-300', borderColor: 'border-teal-200/80 dark:border-teal-900/60' },
    { name: 'Taapharma', count: stats.taaBultos, dotColor: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200/80 dark:border-amber-900/60' },
    { name: 'Innov. Química', count: stats.innovBultos, dotColor: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200/80 dark:border-emerald-900/60' },
    { name: 'Krishpar', count: stats.krishparBultos, dotColor: 'bg-rose-500', textColor: 'text-rose-700 dark:text-rose-300', borderColor: 'border-rose-200/80 dark:border-rose-900/60' },
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Título minimalista */}
        <div className="flex items-center gap-2 px-2 py-1 text-slate-500 dark:text-slate-400">
          <Package className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase">En tránsito</span>
        </div>

        {/* Chips de laboratorios */}
        <div className="flex flex-wrap items-center gap-2">
          {labs.map(lab => (
            <div
              key={lab.name}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 border ${lab.borderColor} text-xs transition-colors`}
            >
              <span className={`w-2 h-2 rounded-full ${lab.dotColor} shrink-0`} />
              <span className="font-medium text-slate-600 dark:text-slate-300">{lab.name}:</span>
              {loading ? (
                <div className="h-4 w-6 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-full" />
              ) : (
                <span className={`font-bold ${lab.textColor}`}>{lab.count}</span>
              )}
            </div>
          ))}

          {/* Total Bultos */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs shadow-xs font-medium">
            <Layers className="h-3.5 w-3.5 opacity-80" />
            <span className="opacity-90">Total:</span>
            {loading ? (
              <div className="h-4 w-8 bg-slate-700 dark:bg-slate-300 animate-pulse rounded-full" />
            ) : (
              <span className="font-bold tracking-tight">{stats.total} bultos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabBultosStats;
