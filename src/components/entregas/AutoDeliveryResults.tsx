
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Conduce } from '@/types/conduces';

interface AutoDeliveryResultsProps {
  selectedConduce: Conduce;
  deliveryNote: string;
  setDeliveryNote: (note: string) => void;
  onManualDelivery: () => void;
  isSubmitting: boolean;
  isProcessingDelivery: boolean;
}

export const AutoDeliveryResults = ({
  selectedConduce,
  deliveryNote,
  setDeliveryNote,
  onManualDelivery,
  isSubmitting,
  isProcessingDelivery
}: AutoDeliveryResultsProps) => {
  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h3 className="font-semibold text-green-800 mb-2">Conduce Detectado - Entrega Procesada</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Número:</span> {selectedConduce.numeroConduce}
        </div>
        <div>
          <span className="font-medium">Cliente:</span> {selectedConduce.numeroCliente}
        </div>
        <div>
          <span className="font-medium">Razón Social:</span> {selectedConduce.razonSocial || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Bultos:</span> {selectedConduce.cantidadBultos}
        </div>
      </div>
      
      <div className="mt-4">
        <Label htmlFor="additional-note">Nota adicional (opcional)</Label>
        <Textarea
          id="additional-note"
          placeholder="Agregar observaciones adicionales si es necesario..."
          value={deliveryNote}
          onChange={(e) => setDeliveryNote(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex gap-3 mt-4">
        <Button
          onClick={onManualDelivery}
          disabled={isSubmitting || isProcessingDelivery}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar con Nota'}
        </Button>
      </div>
    </div>
  );
};
