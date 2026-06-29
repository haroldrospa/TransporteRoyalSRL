
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import * as clienteService from '@/services/clienteService';
import { supabase } from '@/integrations/supabase/client';

export const useSaveLocation = (clientes: any[], refreshData: () => Promise<void>) => {
  const [savingLocation, setSavingLocation] = useState(false);
  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();

  const handleSaveLocation = async (
    numeroCliente: string, 
    coordinates?: { latitude: number; longitude: number }
  ) => {
    setSavingLocation(true);
    try {
      let cliente = clientes?.find(c => c.numeroCliente === numeroCliente);
      
      // Si no está en el array local, buscar directamente en la base de datos
      if (!cliente) {
        console.log('🔵 [SaveLocation] Cliente no en cache, buscando en DB...');
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('numero_cliente', numeroCliente)
          .maybeSingle();
        
        if (error) {
          console.error('❌ [SaveLocation] Error buscando cliente:', error);
          throw new Error('Error al buscar el cliente en la base de datos');
        }
        
        if (data) {
          cliente = {
            id: data.id,
            numeroCliente: data.numero_cliente,
            razonSocial: data.razon_social,
            ciudad: data.ciudad,
            zona: data.zona,
            encomendado: data.encomendado,
            ruta: data.ruta,
            contacto: data.contacto,
            ubicacion: data.ubicacion
          };
        }
      }
      
      if (!cliente) {
        toast({
          title: "Cliente no encontrado",
          description: `No se encontró el cliente con número ${numeroCliente}`,
          variant: "destructive"
        });
        throw new Error('Cliente no encontrado');
      }
      
      let coords = coordinates;
      
      // Si no se pasaron coordenadas, obtenerlas del GPS
      if (!coords) {
        const gpsCoords = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
        coords = {
          latitude: gpsCoords.latitude,
          longitude: gpsCoords.longitude
        };
      }
      
      const ubicacion = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      
      // Actualizar en la base de datos
      const updated = await clienteService.updateCliente(cliente.id, {
        ubicacion
      });
      
      if (!updated) {
        throw new Error('No se pudo actualizar la ubicación en la base de datos');
      }

      // Refrescar los datos para ver el cambio
      await refreshData();
      
    } catch (error) {
      console.error('❌ [SaveLocation] Error:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la ubicación";
      throw new Error(errorMessage);
    } finally {
      setSavingLocation(false);
    }
  };

  return { handleSaveLocation, savingLocation };
};
