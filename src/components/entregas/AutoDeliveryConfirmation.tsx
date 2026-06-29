
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Conduce } from '@/types/conduces';
import { CheckCircle, X, Package, FileText, MapPin } from 'lucide-react';

interface AutoDeliveryConfirmationProps {
  conduce: Conduce;
  detectionMethod: string;
  deliveryNote: string;
  setDeliveryNote: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const AutoDeliveryConfirmation = ({
  conduce,
  detectionMethod,
  deliveryNote,
  setDeliveryNote,
  onConfirm,
  onCancel,
  isSubmitting
}: AutoDeliveryConfirmationProps) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-800">¿Confirmar entrega automática?</h3>
      </div>
      
      <div className="bg-white p-3 rounded border mb-4">
        <p className="text-sm text-blue-700 mb-3">
          Se detectó el conduce por <strong>{detectionMethod}</strong>. ¿Deseas proceder con la entrega?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Conduce:</span> {conduce.numeroConduce}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Factura:</span> {conduce.numeroFactura}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Cliente:</span> {conduce.numeroCliente}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Bultos:</span> {conduce.cantidadBultos}
          </div>
          {conduce.razonSocial && (
            <div className="md:col-span-2">
              <span className="font-medium">Razón Social:</span> {conduce.razonSocial}
            </div>
          )}
          {conduce.ciudad && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Ciudad:</span> {conduce.ciudad}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="delivery-note">Nota de entrega (opcional)</Label>
        <Textarea
          id="delivery-note"
          placeholder="Agregar observaciones sobre la entrega..."
          value={deliveryNote}
          onChange={(e) => setDeliveryNote(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSubmitting}
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Entregando...' : 'Confirmar Entrega'}
        </Button>
      </div>
    </div>
  );
};
