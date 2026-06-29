
import { useState, useRef, useEffect } from 'react';
import { Conduce } from '@/types/conduces';
import { useToast } from '@/hooks/use-toast';

export const useDeliverySubmission = (
  onSubmit: (signature: string, note: string, image: string) => Promise<void>,
  onSaveLocation: (numeroCliente: string, coordinates?: { latitude: number; longitude: number }) => Promise<void>,
  setUploadProgress?: (progress: number) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const progressIntervalRef = useRef<number | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // More realistic progress simulation with optimized intervals
  const simulateProgressUpdates = () => {
    if (!setUploadProgress) return null;

    // Clear any existing interval first
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Start at a higher percentage for better perceived performance
    let progress = 15;
    let speedFactor = 1.0;
    
    const interval = window.setInterval(() => {
      // Adaptive progress: slower as it gets closer to 90%
      if (progress < 50) {
        progress += Math.floor(Math.random() * 10) + 8;
      } else if (progress < 75) {
        progress += Math.floor(Math.random() * 6) + 4;
      } else {
        progress += Math.floor(Math.random() * 3) + 2;
      }
      
      if (progress > 90) {
        progress = 90; // Cap at 90% until actually complete
        clearInterval(interval);
      }
      
      setUploadProgress(progress);
    }, 250 * speedFactor); // Faster interval for better visual feedback

    progressIntervalRef.current = interval;
    return interval;
  };

  const handleSubmit = async (
    conduce: Conduce | null,
    coordinates: { latitude: number; longitude: number } | null,
    signatureData: string,
    deliveryNote: string,
    imageData: string
  ) => {
    if (!conduce) return;
    
    setIsSubmitting(true);
    
    // Create new abort controller for this request
    abortController.current = new AbortController();
    
    // Start simulating progress updates
    const progressInterval = simulateProgressUpdates();
    
    try {
      // First save location if available - run in parallel with submission if possible
      let locationPromise = Promise.resolve();
      if (coordinates && conduce.numeroCliente) {
        console.log('🟡 [DeliverySubmission] Guardando ubicación con coordenadas:', coordinates);
        console.log('🟡 [DeliverySubmission] Número de cliente:', conduce.numeroCliente);
        locationPromise = onSaveLocation(conduce.numeroCliente, coordinates)
          .then(() => {
            console.log('✅ [DeliverySubmission] Ubicación guardada exitosamente');
          })
          .catch(error => {
            console.error('❌ [DeliverySubmission] Error guardando ubicación:', error);
            toast({
              title: "Advertencia",
              description: "No se pudo guardar la ubicación, pero se continuará con la entrega",
              variant: "default"
            });
          });
      } else {
        console.log('⚠️ [DeliverySubmission] NO se guardará ubicación');
        console.log('⚠️ [DeliverySubmission] coordinates:', coordinates);
        console.log('⚠️ [DeliverySubmission] numeroCliente:', conduce?.numeroCliente);
      }
      
      // Run both promises concurrently
      await Promise.all([
        locationPromise,
        onSubmit(signatureData, deliveryNote, imageData)
      ]);
      
      // Set progress to 100% when complete
      if (setUploadProgress) {
        setUploadProgress(100);
      }
      
      toast({
        title: "Éxito",
        description: "Entrega completada correctamente",
        variant: "default"
      });
      
    } catch (error) {
      if (abortController.current?.signal.aborted) {
        console.log('Upload was cancelled');
        return;
      }
      
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la entrega. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      throw error; // Re-throw to handle in component
    } finally {
      // Clear the progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsSubmitting(false);
      abortController.current = null;
    }
  };

  // Function to cancel ongoing upload
  const cancelUpload = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (setUploadProgress) {
      setUploadProgress(0);
    }
    
    setIsSubmitting(false);
  };

  const cleanup = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  return { 
    handleSubmit, 
    isSubmitting, 
    setIsSubmitting, 
    cleanup,
    cancelUpload 
  };
};
