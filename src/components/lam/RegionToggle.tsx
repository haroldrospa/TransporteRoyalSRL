
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button 
        size="sm"
        variant={regionActual === 'Todas' ? "default" : "outline"}
        onClick={() => onRegionChange('Todas')}
        className="gap-1.5 font-medium"
      >
        Todas las Zonas
        {counts.total > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {counts.total}
          </Badge>
        )}
      </Button>
      <Button 
        size="sm"
        variant={regionActual === 'Norte' ? "default" : "outline"}
        onClick={() => onRegionChange('Norte')}
        className="gap-1.5 font-medium"
      >
        Zona Norte
        {counts.norte > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {counts.norte}
          </Badge>
        )}
      </Button>
      <Button 
        size="sm"
        variant={regionActual === 'Sur' ? "default" : "outline"}
        onClick={() => onRegionChange('Sur')}
        className="gap-1.5 font-medium"
      >
        Zona Sur
        {counts.sur > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {counts.sur}
          </Badge>
        )}
      </Button>
      <Button 
        size="sm"
        variant={regionActual === 'Este' ? "default" : "outline"}
        onClick={() => onRegionChange('Este')}
        className="gap-1.5 font-medium"
      >
        Zona Este
        {counts.este > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {counts.este}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default RegionToggle;
