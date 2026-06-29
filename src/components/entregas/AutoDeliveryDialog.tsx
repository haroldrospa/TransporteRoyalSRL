
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConduceImageCapture } from './ConduceImageCapture';
import { AutoDeliveryInstructions } from './AutoDeliveryInstructions';
import { AutoDeliveryProcessing } from './AutoDeliveryProcessing';
import { AutoDeliveryResults } from './AutoDeliveryResults';
import { AutoDeliveryConfirmation } from './AutoDeliveryConfirmation';
import { useAutoDelivery } from '@/hooks/useAutoDelivery';

interface AutoDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeliveryComplete: () => void;
}

export const AutoDeliveryDialog = ({
  open,
  onOpenChange,
  onDeliveryComplete
}: AutoDeliveryDialogProps) => {
  const {
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
  } = useAutoDelivery(onDeliveryComplete);

  const onDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entrega Automática por Código de Barras</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <AutoDeliveryInstructions />

          <ConduceImageCapture
            onConduceDetected={handleConduceDetected}
            disabled={isSubmitting || isProcessingDelivery || !!pendingDelivery}
          />
          
          <AutoDeliveryProcessing isProcessing={isProcessingDelivery} />
          
          {pendingDelivery && (
            <AutoDeliveryConfirmation
              conduce={pendingDelivery.conduce}
              detectionMethod={pendingDelivery.detectionMethod}
              deliveryNote={deliveryNote}
              setDeliveryNote={setDeliveryNote}
              onConfirm={handleConfirmDelivery}
              onCancel={handleCancelDelivery}
              isSubmitting={isSubmitting}
            />
          )}
          
          {selectedConduce && !isProcessingDelivery && !pendingDelivery && (
            <AutoDeliveryResults
              selectedConduce={selectedConduce}
              deliveryNote={deliveryNote}
              setDeliveryNote={setDeliveryNote}
              onManualDelivery={handleManualDelivery}
              isSubmitting={isSubmitting}
              isProcessingDelivery={isProcessingDelivery}
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onDialogOpenChange(false)}
              disabled={isSubmitting || isProcessingDelivery}
              className="flex-1"
            >
              {isProcessingDelivery ? 'Procesando...' : 'Cerrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
