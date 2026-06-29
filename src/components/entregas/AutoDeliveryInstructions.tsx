
import React from 'react';

export const AutoDeliveryInstructions = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-800 mb-2">Instrucciones</h3>
      <p className="text-sm text-blue-700">
        Tome una foto clara del conduce donde se vea el código de barras o el número de factura. 
        El sistema identificará automáticamente el número y procesará la entrega.
      </p>
    </div>
  );
};
