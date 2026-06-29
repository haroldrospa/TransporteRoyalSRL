
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  message?: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  isProcessing, 
  message = "Procesando la solicitud..."
}) => {
  if (!isProcessing) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-start justify-center backdrop-blur-sm pt-20">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {message}
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Por favor espere mientras se completa la operación.
            No cierre esta ventana hasta que finalice el proceso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
