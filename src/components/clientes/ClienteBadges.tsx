
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, AlertCircle } from 'lucide-react';
import { getClientType } from './utils/clienteTypeUtils';

export const ClienteTypeBadge = ({ numeroCliente }: { numeroCliente: string }) => {
  // Determine badge variant based on client type
  const getBadgeVariant = () => {
    if (numeroCliente.startsWith('6')) return "blue";
    if (numeroCliente.startsWith('5')) return "green";
    if (numeroCliente.startsWith('7')) return "yellow";
    return "default";
  };

  return (
    <Badge 
      variant={getBadgeVariant() as any} 
      className={`${getBadgeVariant() === 'blue' ? 'bg-blue-500' : 
                    getBadgeVariant() === 'green' ? 'bg-green-500' : 
                    getBadgeVariant() === 'yellow' ? 'bg-amber-500' : ''}`}
    >
      {getClientType(numeroCliente)}
    </Badge>
  );
};

export const ClienteUbicacionButton = ({ 
  ubicacion, 
  openMaps 
}: { 
  ubicacion?: string, 
  openMaps: (ubicacion?: string) => void 
}) => {
  if (!ubicacion) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
        <AlertCircle className="h-4 w-4 mr-1" />
        No ubicado
      </Button>
    );
  }
  
  return (
    <Button variant="ghost" size="sm" onClick={() => openMaps(ubicacion)}>
      <Map className="h-4 w-4 mr-1" />
      Ver mapa
    </Button>
  );
};
