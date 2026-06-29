
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Conduce } from '@/types/conduces';
import { useOptimizedEntregasData } from '@/hooks/useOptimizedEntregasData';
import { useDeliveryHandlers } from '@/hooks/useDeliveryHandlers';
import { useData } from '@/contexts/DataContext';

export const useAutoDelivery = (onDeliveryComplete: () => void) => {
  const [selectedConduce, setSelectedConduce] = useState<Conduce | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingDelivery, setIsProcessingDelivery] = useState(false);
  const [pendingDelivery, setPendingDelivery] = useState<{
    conduce: Conduce;
    imageData: string;
    detectionMethod: string;
  } | null>(null);
  
  const { toast } = useToast();
  const { pendingDeliveries, handleRefreshData } = useOptimizedEntregasData();
  const { entregarConduce } = useData();
  const { handleDeliverySubmit } = useDeliveryHandlers(
    entregarConduce,
    () => Promise.resolve(), // devolverConduce not needed here
    handleRefreshData,
    pendingDeliveries
  );

  const handleConduceDetected = useCallback(async (
    detectedValue: string, 
    imageData: string, 
    detectionType: 'conduce' | 'factura' = 'conduce',
    facturaNumber?: string
  ) => {
    console.log(`🔍 Buscando conduce por ${detectionType}:`, detectedValue);
    console.log(`📊 Total conduces pendientes disponibles: ${pendingDeliveries.length}`);
    setIsProcessingDelivery(true);
    
    try {
      let foundConduce: Conduce | undefined;
      let searchMethod = '';
      
      // Primero buscar por el tipo detectado
      if (detectionType === 'conduce') {
        foundConduce = pendingDeliveries.find(c => 
          c.numeroConduce === detectedValue && c.estado === 'En tránsito'
        );
        searchMethod = 'código de conduce';
        console.log(`🔍 Buscando por numeroConduce: ${detectedValue}`);
        
        // Si no encuentra por código de conduce, buscar por número de factura
        if (!foundConduce) {
          foundConduce = pendingDeliveries.find(c => 
            c.numeroFactura === detectedValue && c.estado === 'En tránsito'
          );
          if (foundConduce) {
            searchMethod = 'número de factura (respaldo)';
            console.log(`🔄 No encontrado por código, buscando por numeroFactura: ${detectedValue}`);
          }
        }
      } else if (detectionType === 'factura') {
        foundConduce = pendingDeliveries.find(c => 
          c.numeroFactura === detectedValue && c.estado === 'En tránsito'
        );
        searchMethod = 'número de factura';
        console.log(`🔍 Buscando por numeroFactura: ${detectedValue}`);
        
        // Si no encuentra por factura, buscar por código de conduce
        if (!foundConduce) {
          foundConduce = pendingDeliveries.find(c => 
            c.numeroConduce === detectedValue && c.estado === 'En tránsito'
          );
          if (foundConduce) {
            searchMethod = 'código de conduce (respaldo)';
            console.log(`🔄 No encontrado por factura, buscando por numeroConduce: ${detectedValue}`);
          }
        }
      }
      
      console.log(`📋 Conduces disponibles (primeros 5):`, pendingDeliveries.slice(0, 5).map(c => ({
        numeroConduce: c.numeroConduce,
        numeroFactura: c.numeroFactura,
        estado: c.estado,
        encomendado: c.encomendado,
        region: c.region
      })));
      
      if (!foundConduce) {
        console.log(`❌ No se encontró conduce activo con valor: ${detectedValue}`);
        console.log(`🔍 Verificando si existe parcialmente:`, pendingDeliveries.find(c => 
          c.numeroConduce.includes(detectedValue) || c.numeroFactura.includes(detectedValue)
        ));
        
        // Intentar refrescar datos y buscar nuevamente
        console.log('🔄 Intentando refrescar datos para buscar el conduce...');
        await handleRefreshData();
        
        // Buscar nuevamente después del refresh con más tolerancia
        const allConduces = pendingDeliveries;
        foundConduce = allConduces.find(c => 
          c.numeroConduce.toLowerCase().includes(detectedValue.toLowerCase()) ||
          c.numeroFactura.toLowerCase().includes(detectedValue.toLowerCase())
        );
        
        if (!foundConduce) {
          toast({
            title: "❌ Conduce no encontrado",
            description: `No se encontró un conduce activo con el valor: ${detectedValue}. Verifique que esté asignado a su camión y en estado "En tránsito".`,
            variant: "destructive"
          });
          return;
        }
      }

      console.log(`✅ Conduce encontrado por ${searchMethod}:`, foundConduce);
      
      // En lugar de entregar automáticamente, guardamos para confirmación
      setPendingDelivery({
        conduce: foundConduce,
        imageData,
        detectionMethod: searchMethod
      });
      
      toast({
        title: "🔍 Conduce detectado",
        description: `Se encontró el conduce ${foundConduce.numeroConduce} por ${searchMethod}. Confirma la entrega.`,
      });
      
    } catch (error) {
      console.error('❌ Error en detección de conduce:', error);
      toast({
        title: "❌ Error en detección",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsProcessingDelivery(false);
    }
  }, [pendingDeliveries, toast, handleRefreshData]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!pendingDelivery) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('🚚 Procesando entrega confirmada automáticamente');
      
      // Usar el manejo de entrega existente con firma automática
      await handleDeliverySubmit(
        pendingDelivery.conduce,
        'AUTO_DELIVERY_SIGNATURE', // Firma automática
        `Entrega automática por ${pendingDelivery.detectionMethod}${deliveryNote ? ` - ${deliveryNote}` : ''}`,
        pendingDelivery.imageData,
        () => {
          toast({
            title: "✅ Entrega completada",
            description: `Conduce ${pendingDelivery.conduce.numeroConduce} entregado automáticamente`,
          });
          onDeliveryComplete();
          setPendingDelivery(null);
        },
        true, // backgroundMode
        true  // skipSignatureValidation
      );
      
    } catch (error) {
      console.error('❌ Error en entrega automática:', error);
      toast({
        title: "❌ Error en entrega automática",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingDelivery, deliveryNote, handleDeliverySubmit, toast, onDeliveryComplete]);

  const handleCancelDelivery = useCallback(() => {
    setPendingDelivery(null);
    toast({
      title: "❌ Entrega cancelada",
      description: "La entrega automática ha sido cancelada",
    });
  }, [toast]);

  const handleManualDelivery = useCallback(async () => {
    if (!selectedConduce) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('🖊️ Procesando entrega manual con nota adicional');
      
      await handleDeliverySubmit(
        selectedConduce,
        'MANUAL_DELIVERY_SIGNATURE',
        `Entrega confirmada manualmente${deliveryNote ? ` - ${deliveryNote}` : ''}`,
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent image
        () => {
          toast({
            title: "✅ Entrega completada",
            description: `Conduce ${selectedConduce.numeroConduce} entregado con nota adicional`,
          });
          onDeliveryComplete();
        },
        false,
        true
      );
      
    } catch (error) {
      console.error('❌ Error en entrega manual:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedConduce, deliveryNote, handleDeliverySubmit, toast, onDeliveryComplete]);

  const handleClose = useCallback(() => {
    setSelectedConduce(null);
    setDeliveryNote('');
    setPendingDelivery(null);
    setIsSubmitting(false);
    setIsProcessingDelivery(false);
  }, []);

  return {
    selectedConduce,
    deliveryNote,
    setDeliveryNote,
    isSubmitting,
    isProcessingDelivery,
    pendingDelivery,
    handleConduceDetected,
    handleConfirmDelivery,
    handleCancelDelivery,
    handleManualDelivery,
    handleClose
  };
};
