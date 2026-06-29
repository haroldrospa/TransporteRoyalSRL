
import { useState, useCallback, useEffect } from 'react';
import { Conduce } from '@/types/conduces';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { useDeliverySubmission } from './useDeliverySubmission';
import { supabase } from '@/integrations/supabase/client';
import { Cliente } from '@/types/cliente';

export const useDeliveryDialog = (
  conduce: Conduce | null,
  onOpenChange: (open: boolean) => void,
  onSubmit: (signature: string, note: string, image: string) => Promise<void>,
  onSaveLocation: (numeroCliente: string, coordinates?: { latitude: number; longitude: number }) => Promise<void>,
  isSubmitting: boolean
) => {
  const [deliveryNote, setDeliveryNote] = useState('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [imageData, setImageData] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [backgroundUpload, setBackgroundUpload] = useState(false);
  const [clienteFromDB, setClienteFromDB] = useState<Cliente | null>(null);
  
  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();
  const { getClienteByNumero } = useData();
  const { handleSubmit } = useDeliverySubmission(onSubmit, onSaveLocation, setUploadProgress);
  
  // Buscar cliente en cache local o en DB
  const clienteFromCache = conduce ? getClienteByNumero(conduce.numeroCliente) : null;
  
  // Si no está en cache, buscar en DB
  useEffect(() => {
    const fetchClienteFromDB = async () => {
      if (!conduce?.numeroCliente || clienteFromCache) {
        setClienteFromDB(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('numero_cliente', conduce.numeroCliente)
          .maybeSingle();
        
        if (!error && data) {
          setClienteFromDB({
            id: data.id,
            numeroCliente: data.numero_cliente,
            razonSocial: data.razon_social,
            ciudad: data.ciudad,
            zona: data.zona as 'Norte' | 'Sur',
            encomendado: data.encomendado || undefined,
            ruta: data.ruta || undefined,
            contacto: data.contacto || undefined,
            ubicacion: data.ubicacion || undefined
          });
        }
      } catch (error) {
        console.error('Error fetching cliente from DB:', error);
      }
    };
    
    fetchClienteFromDB();
  }, [conduce?.numeroCliente, clienteFromCache]);
  
  const cliente = clienteFromCache || clienteFromDB;
  const hasStoredLocation = !!cliente?.ubicacion && cliente.ubicacion.length > 0;
  const isFormValid = !!imageData;

  const handleSaveLocation = async () => {
    if (!conduce?.numeroCliente) return;
    
    try {
      // Obtener coordenadas
      const coords = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Siempre pedir ubicación nueva
      });
      
      const newCoordinates = {
        latitude: coords.latitude,
        longitude: coords.longitude
      };
      
      setCoordinates(newCoordinates);
      
      // Guardar inmediatamente en la base de datos
      await onSaveLocation(conduce.numeroCliente, newCoordinates);
      
      toast({
        title: "Ubicación guardada",
        description: "Las coordenadas se han guardado en la base de datos",
      });
    } catch (error) {
      console.error('Error getting/saving coordinates:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo obtener o guardar la ubicación. Verifique los permisos GPS.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSubmitDelivery = async () => {
    // A petición del usuario: cerrar la ventana inmediatamente y hacer todo en segundo plano
    // para que no tengan que esperar mirando la pantalla de carga.
    return handleBackgroundSubmit();
  };

  const handleBackgroundSubmit = async () => {
    if (!conduce || !imageData) return;
    
    setBackgroundUpload(true);
    
    let finalCoordinates = coordinates;
    
    // Si no tiene ubicación guardada y no hay coordenadas, obtenerlas automáticamente
    if (!hasStoredLocation && !coordinates && conduce?.numeroCliente) {
      try {
        const coords = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
        
        finalCoordinates = {
          latitude: coords.latitude,
          longitude: coords.longitude
        };
        
        setCoordinates(finalCoordinates);
      } catch (error) {
        console.error('Error obteniendo coordenadas automáticamente:', error);
        // Continuar sin coordenadas si falla
      }
    }
    
    // Start the upload in the background
    handleSubmit(conduce, finalCoordinates, signatureData, deliveryNote, imageData)
      .then(() => {
        toast({
          title: "Entrega completada",
          description: "Los datos de la entrega se han subido correctamente",
          variant: "default"
        });
        setBackgroundUpload(false);
        setUploadProgress(100);
      })
      .catch((error) => {
        console.error('Failed to submit delivery:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al subir los datos de la entrega",
          variant: "destructive"
        });
        setBackgroundUpload(false);
      });
      
    // Close the dialog and show toast notification
    handleOpenChange(false);
    toast({
      title: "Subiendo entrega",
      description: "La entrega se está procesando en segundo plano",
      variant: "default",
    });
  };

  const handleOpenChange = useCallback((newOpen: boolean) => {
    // Prevent closing the dialog while submission is in progress
    if (isSubmitting && !newOpen && !backgroundUpload) {
      return;
    }
    
    if (!newOpen) {
      setDeliveryNote('');
      setSignatureData('');
      setImageData('');
      setCoordinates(null);
      setUploadProgress(0);
      setClienteFromDB(null);
    }
    onOpenChange(newOpen);
  }, [isSubmitting, backgroundUpload, onOpenChange]);

  return {
    deliveryNote,
    setDeliveryNote,
    signatureData,
    setSignatureData,
    imageData,
    setImageData,
    coordinates,
    uploadProgress,
    backgroundUpload,
    cliente,
    hasStoredLocation,
    isFormValid,
    handleSaveLocation,
    handleSubmitDelivery,
    handleBackgroundSubmit,
    handleOpenChange
  };
};
