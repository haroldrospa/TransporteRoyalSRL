
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { resizeCanvas } from '@/utils/imageCompression';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export const CameraCapture = ({ onCapture, disabled = false, isProcessing = false }: CameraCaptureProps) => {
  const handleCameraCapture = async () => {
    try {
      console.log('📷 Iniciando captura optimizada...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1024 }, // Resolución más optimizada
          height: { ideal: 768 }
        }
      });
      
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.srcObject = stream;
      await video.play();

      // Esperar un momento para que la cámara se estabilice
      await new Promise(resolve => setTimeout(resolve, 500));

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }
      
      context.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      // Usar función de redimensionamiento optimizado
      const imageData = resizeCanvas(canvas, 1024, 1024, 0.75); // Calidad más optimizada
      console.log('✅ Captura completada con compresión');
      
      onCapture(imageData);
      
    } catch (error) {
      console.error('❌ Error de cámara:', error);
      throw error;
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleCameraCapture}
      disabled={disabled || isProcessing}
      className="flex-1"
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Camera className="h-4 w-4 mr-2" />
      )}
      {isProcessing ? 'Procesando...' : 'Capturar foto'}
    </Button>
  );
};
