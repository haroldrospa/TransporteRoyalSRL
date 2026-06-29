
import React from 'react';

interface AutoDeliveryProcessingProps {
  isProcessing: boolean;
}

export const AutoDeliveryProcessing = ({ isProcessing }: AutoDeliveryProcessingProps) => {
  if (!isProcessing) return null;

  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
        <span className="text-green-800 font-medium">Procesando entrega automática...</span>
      </div>
    </div>
  );
};
