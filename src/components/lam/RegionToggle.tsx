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
    { id: 'Todas', label: 'Todas las Zonas', count: counts.total },
    { id: 'Norte', label: 'Zona Norte', count: counts.norte },
    { id: 'Sur', label: 'Zona Sur', count: counts.sur },
    { id: 'Este', label: 'Zona Este', count: counts.este },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1">
      {regions.map(r => {
        const isActive = regionActual === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onRegionChange(r.id)}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-150 cursor-pointer select-none whitespace-nowrap
              ${isActive
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <span>{r.label}</span>
            {r.count > 0 && (
              <span className={`
                inline-flex items-center justify-center min-w-[20px] px-1.5 py-px rounded-full text-xs font-semibold
                ${isActive
                  ? 'bg-amber-400 text-slate-900'
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
  );
};

export default RegionToggle;
