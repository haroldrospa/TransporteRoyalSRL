
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Conduce } from '@/types/conduces';
import { useDeliveryHandlers } from '@/hooks/useDeliveryHandlers';

export const useEntregasDialogs = (
  entregarConduce: (id: string, signature: string, note: string, image: string) => Promise<void>,
  devolverConduce: (id: string, note: string) => Promise<void>,
  refreshData: () => Promise<void>,
  conduces: Conduce[]
) => {
  const [selectedConduce, setSelectedConduce] = useState<Conduce | null>(null);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pendientes');
  const { toast } = useToast();
  
  const { 
    handleDeliverySubmit, 
    handleReturnSubmit, 
    isSubmitting, 
    additionalConduces, 
    checkForAdditionalConduces,
    cleanup
  } = useDeliveryHandlers(
    entregarConduce,
    devolverConduce,
    refreshData,
    conduces
  );

  const handleDeliverySelection = useCallback((conduce: Conduce) => {
    setSelectedConduce(conduce);
    checkForAdditionalConduces(conduce);
    setShowDeliveryDialog(true);
  }, [checkForAdditionalConduces]);

  const handleReturnSelection = useCallback((conduce: Conduce) => {
    setSelectedConduce(conduce);
    setShowReturnDialog(true);
  }, []);

  const showDetails = useCallback((conduce: Conduce) => {
    setSelectedConduce(conduce);
    toast({
      title: "Detalles de entrega",
      description: `Entregado en ${conduce.tiempoEntrega || 'N/A'} con firma: ${conduce.firma ? 'Sí' : 'No'}`,
    });
  }, [toast]);

  return {
    selectedConduce,
    setSelectedConduce,
    showDeliveryDialog,
    setShowDeliveryDialog,
    showReturnDialog,
    setShowReturnDialog,
    activeTab,
    setActiveTab,
    handleDeliverySubmit,
    handleReturnSubmit,
    isSubmitting,
    additionalConduces,
    handleDeliverySelection,
    handleReturnSelection,
    showDetails,
    cleanup
  };
};
