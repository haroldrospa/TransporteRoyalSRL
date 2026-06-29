
import { Button } from '@/components/ui/button';
import { Region } from '@/types/conduces';

interface RegionToggleProps {
  regionActual: Region;
  onRegionChange: (region: Region) => void;
}

const RegionToggle = ({ regionActual, onRegionChange }: RegionToggleProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant={regionActual === 'Norte' ? "default" : "outline"}
        onClick={() => onRegionChange('Norte')}
      >
        Zona Norte
      </Button>
      <Button 
        variant={regionActual === 'Sur' ? "default" : "outline"}
        onClick={() => onRegionChange('Sur')}
      >
        Zona Sur
      </Button>
    </div>
  );
};

export default RegionToggle;
