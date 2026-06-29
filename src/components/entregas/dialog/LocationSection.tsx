
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

interface LocationSectionProps {
  coordinates: { latitude: number; longitude: number } | null;
  hasStoredLocation: boolean;
  storedLocation?: string;
  onSaveLocation: () => Promise<void>;
}

export const LocationSection = ({
  coordinates,
  hasStoredLocation,
  storedLocation,
  onSaveLocation
}: LocationSectionProps) => {
  const formatCoordinates = (coords: {latitude: number, longitude: number}) => {
    return `${coords.latitude.toFixed(6)}°, ${coords.longitude.toFixed(6)}°`;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-royal-blue flex items-center gap-2">
        <MapPin className="h-4 w-4 text-royal-gold" />
        Ubicación del Cliente
      </h4>
      
      {coordinates ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 shadow-sm transition-all">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white shrink-0 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">{formatCoordinates(coordinates)}</p>
            <p className="text-xs text-green-600 font-medium">Ubicación obtenida y guardada</p>
          </div>
        </div>
      ) : hasStoredLocation ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-royal-light border border-royal-gray shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-royal-blue/10 text-royal-blue shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-royal-blue break-all">{storedLocation}</p>
              <p className="text-xs text-muted-foreground font-medium">Ubicación registrada</p>
            </div>
          </div>
          <Button
            onClick={onSaveLocation}
            variant="outline"
            size="sm"
            className="shrink-0 border-royal-blue/20 text-royal-blue hover:bg-royal-blue hover:text-white transition-all shadow-sm rounded-lg"
          >
            <Navigation className="h-3.5 w-3.5 mr-1.5" />
            Actualizar
          </Button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-royal-yellow/10 border border-royal-yellow/40 border-dashed shadow-sm transition-all hover:bg-royal-yellow/20">
          <Button
            onClick={onSaveLocation}
            variant="outline"
            size="sm"
            className="w-full border-royal-gold text-royal-blue hover:bg-royal-gold hover:text-white gap-2 font-bold transition-all shadow-sm rounded-lg"
          >
            <Navigation className="h-4 w-4" />
            Obtener Ubicación Actual
          </Button>
          <p className="text-xs text-royal-blue/70 mt-2 text-center font-medium">
            Se le pedirá permiso para acceder al GPS
          </p>
        </div>
      )}
    </div>
  );
};
