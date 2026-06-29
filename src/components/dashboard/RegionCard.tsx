
import { MapPin, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RegionCardProps {
  region: 'Norte' | 'Sur';
  bultos: number;
  color: string;
  onClick: () => void;
}

export const RegionCard = ({ region, bultos, color, onClick }: RegionCardProps) => {
  return (
    <Card 
      className={`relative overflow-hidden border-l-4 border-l-${color}-600 hover:shadow-md transition-all cursor-pointer h-full`}
      onClick={onClick}
    >
      <CardHeader className="pb-1 sm:pb-2">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <MapPin className={`h-5 w-5 text-${color}-600`} />
          Región {region}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-3xl sm:text-4xl font-bold">{bultos}</p>
            <p className="text-muted-foreground text-sm">Bultos en tránsito</p>
          </div>
          <Button className={`bg-${color}-600 hover:bg-${color}-700 text-sm sm:text-base`}>
            Ver detalles
          </Button>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Truck className={`h-16 sm:h-24 w-16 sm:w-24 text-${color}-600`} />
        </div>
      </CardContent>
    </Card>
  );
};
