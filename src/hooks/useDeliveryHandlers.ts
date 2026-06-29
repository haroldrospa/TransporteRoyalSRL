
import { useState, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Conduce } from '@/types/conduces';

export const useDeliveryHandlers = (
  entregarConduce: (id: string, signature: string, note: string, image: string) => Promise<void>,
  devolverConduce: (id: string, note: string) => Promise<void>,
  refreshData: () => Promise<void>,
  conduces: Conduce[]
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalConduces, setAdditionalConduces] = useState<Conduce[]>([]);
  const { toast } = useToast();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized conduces map - reduced memory allocations
  const conducesMap = useMemo(() => {
    const map = new Map<string, Conduce[]>();
    
    conduces.forEach(conduce => {
      if (conduce.numeroCliente && conduce.estado === 'En tránsito') {
        const existing = map.get(conduce.numeroCliente);
        if (existing) {
          existing.push(conduce);
        } else {
          map.set(conduce.numeroCliente, [conduce]);
        }
      }
    });
    
    return map;
  }, [conduces]);

  // Optimized version that doesn't recreate arrays unnecessarily
  const checkForAdditionalConduces = useCallback((selectedConduce: Conduce) => {
    if (!selectedConduce || !selectedConduce.numeroCliente) return [];
    
    const clientConduces = conducesMap.get(selectedConduce.numeroCliente);
    if (!clientConduces || clientConduces.length <= 1) {
      setAdditionalConduces([]);
      return [];
    }
    
    const clientAdditionalConduces = clientConduces.filter(c => c.id !== selectedConduce.id);
    
    setAdditionalConduces(clientAdditionalConduces);
    return clientAdditionalConduces;
  }, [conducesMap]);

  // Optimized to debounce data refresh
  const debouncedRefreshData = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await refreshData();
      refreshTimeoutRef.current = null;
    }, 300);
  }, [refreshData]);

  const handleDeliverySubmit = useCallback(async (
    selectedConduce: Conduce,
    signature: string,
    note: string,
    image: string,
    onSuccess: () => void,
    backgroundMode: boolean = false,
    skipSignatureValidation: boolean = false // Nuevo parámetro para saltar validación de firma
  ) => {
    if (!selectedConduce) {
      console.error('No conduce selected');
      return;
    }
    
    // Removed debug logging for performance
    

    
    if (!image) {
      console.error('Missing image');
      toast({
        title: "Error",
        description: "Debe subir una foto del conduce antes de completar la entrega",
        variant: "destructive"
      });
      return;
    }
    
    if (!backgroundMode) {
      setIsSubmitting(true);
    }
    
    try {
      // Optimized delivery call
      
      // Make sure we're passing the correct encomendado information
      await entregarConduce(
        selectedConduce.id, 
        signature || 'AUTO_DELIVERY', // Usar firma predeterminada si no hay firma
        note || '',
        image
      );
      
      // Success - no logging for performance
      
      if (!backgroundMode) {
        toast({
          title: "Entrega completada",
          description: `Conduce ${selectedConduce.numeroConduce} marcado como entregado`,
        });
      }

      const clientAdditionalConduces = checkForAdditionalConduces(selectedConduce);
      
      if (clientAdditionalConduces.length > 0 && !backgroundMode) {
        toast({
          title: "Atención",
          description: `El cliente ${selectedConduce.numeroCliente} tiene ${clientAdditionalConduces.length} conduce(s) adicional(es) pendiente(s)`,
          variant: "default"
        });
      }
      
      onSuccess();
      debouncedRefreshData();
    } catch (error) {
      console.error('Error completing delivery:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        conduceId: selectedConduce.id
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo completar la entrega",
        variant: "destructive"
      });
      throw error;
    } finally {
      if (!backgroundMode) {
        setIsSubmitting(false);
      }
    }
  }, [entregarConduce, toast, checkForAdditionalConduces, debouncedRefreshData]);

  const handleReturnSubmit = useCallback(async (
    selectedConduce: any,
    note: string,
    onSuccess: () => void
  ) => {
    if (!selectedConduce) {
      console.error('No conduce selected for return');
      return;
    }
    
    // Optimized return submission
    
    setIsSubmitting(true);
    try {
      await devolverConduce(selectedConduce.id, note);
      
      // Return completed successfully
      
      toast({
        title: "Devolución registrada",
        description: `Conduce ${selectedConduce.numeroConduce} marcado como devuelto`,
      });
      
      onSuccess();
      debouncedRefreshData();
    } catch (error) {
      console.error('Error returning delivery:', error);
      console.error('Return error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        conduceId: selectedConduce.id
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la devolución",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [devolverConduce, toast, debouncedRefreshData]);

  // Cleanup to prevent memory leaks
  const cleanup = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }, []);

  return {
    handleDeliverySubmit,
    handleReturnSubmit,
    isSubmitting,
    additionalConduces,
    checkForAdditionalConduces,
    cleanup
  };
};
