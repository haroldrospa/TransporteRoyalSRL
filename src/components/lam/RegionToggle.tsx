
import { Button } from '@/components/ui/button';
import { Conduce, Region } from '@/types/conduces';
import { Globe, MapPin, Compass, Navigation } from 'lucide-react';

interface RegionToggleProps {
  regionActual: Region | string;
  onRegionChange: (region: any) => void;
  conduces?: Conduce[];
}

const RegionToggle = ({ regionActual, onRegionChange, conduces = [] }: RegionToggleProps) => {
  const counts = {
    total: conduces.length,
    norte: conduces.filter(c => c?.region === 'Norte').length,
    sur: conduces.filter(c => c?.region === 'Sur').length,
    este: conduces.filter(c => c?.region === 'Este').length,
  };

  const regions = [
    {
      id: 'Todas',
      label: 'Todas las Zonas',
      count: counts.total,
      icon: Globe,
      accentColor: 'from-blue-600 to-indigo-600',
      activeBadge: 'bg-white/25 text-white border-white/20',
      inactiveBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'Norte',
      label: 'Zona Norte',
      count: counts.norte,
      icon: Compass,
      accentColor: 'from-sky-600 to-cyan-600',
      activeBadge: 'bg-white/25 text-white border-white/20',
      inactiveBadge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    },
    {
      id: 'Sur',
      label: 'Zona Sur',
      count: counts.sur,
      icon: Navigation,
      accentColor: 'from-emerald-600 to-teal-600',
      activeBadge: 'bg-white/25 text-white border-white/20',
      inactiveBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'Este',
      label: 'Zona Este',
      count: counts.este,
      icon: MapPin,
      accentColor: 'from-amber-600 to-orange-600',
      activeBadge: 'bg-white/25 text-white border-white/20',
      inactiveBadge: 'bg-amber-100 text-amber-750 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
  ];

  return (
    <div className="bg-slate-100/90 dark:bg-slate-850 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm inline-flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
      {regions.map(r => {
        const isActive = regionActual === r.id;
        const Icon = r.icon;

        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onRegionChange(r.id)}
            className={`
              relative flex items-center justify-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
              transition-all duration-200 cursor-pointer select-none flex-1 sm:flex-initial
              ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md shadow-slate-900/20 scale-[1.02] ring-1 ring-slate-950/10'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
              }
            `}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-70'}`} />
            <span className="whitespace-nowrap tracking-tight">{r.label}</span>
            {r.count > 0 && (
              <span
                className={`
                  inline-flex items-center justify-center px-2.5 py-0.5 min-w-[24px] rounded-full text-xs sm:text-sm font-bold border transition-colors
                  ${isActive ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-sm' : r.inactiveBadge}
                `}
              >
                {r.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RegionToggle;
