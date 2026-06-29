
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useMapHandlers = () => {
  const { toast } = useToast();

  const openGoogleMaps = useCallback((ubicacion: string | undefined) => {
    if (!ubicacion) {
      toast({
        title: "Ubicación no disponible",
        description: "No hay coordenadas disponibles para este cliente",
        variant: "destructive"
      });
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${ubicacion}`, '_blank');
  }, [toast]);

  return {
    openGoogleMaps
  };
};
