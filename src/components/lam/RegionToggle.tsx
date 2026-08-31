import { Conduce, Region } from '@/types/conduces';

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
    { id: 'Todas', label: 'Todas las Zonas', shortLabel: 'Todas', count: counts.total },
    { id: 'Norte', label: 'Zona Norte', shortLabel: 'Norte', count: counts.norte },
    { id: 'Sur', label: 'Zona Sur', shortLabel: 'Sur', count: counts.sur },
    { id: 'Este', label: 'Zona Este', shortLabel: 'Este', count: counts.este },
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 -mb-1 scrollbar-none">
      <div className="inline-flex sm:flex items-center gap-1 bg-muted/40 border border-border/60 rounded-xl p-1 min-w-full sm:min-w-0 sm:w-fit">
        {regions.map(r => {
          const isActive = regionActual === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRegionChange(r.id)}
              className={`
                flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium
                transition-all duration-150 cursor-pointer select-none whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }
              `}
            >
              <span className="hidden sm:inline">{r.label}</span>
              <span className="inline sm:hidden">{r.shortLabel}</span>
              {r.count > 0 && (
                <span className={`
                  inline-flex items-center justify-center min-w-[18px] px-1.5 py-0.2 rounded-full text-[11px] font-bold
                  ${isActive
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                  }
                `}>
                  {r.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RegionToggle;
