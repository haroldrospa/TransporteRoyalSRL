
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Trash2 } from 'lucide-react';
import { ImagePreview } from './display/ImagePreview';
import { ProcessingResult } from './display/ProcessingResult';
import { processImageOCR, ProcessResult } from './ocr/ocrProcessor';
import { compressImage } from '@/utils/imageCompression';

interface ConduceImageCaptureProps {
  onConduceDetected: (conduceNumber: string, imageData: string, detectionType?: 'conduce' | 'factura', facturaNumber?: string) => void;
  disabled?: boolean;
}

export const ConduceImageCapture = ({ 
  onConduceDetected, 
  disabled = false 
}: ConduceImageCaptureProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setResult(null);
    setDebugInfo(null);
    
    try {
      const { result: processResult, debugInfo: processDebugInfo } = await processImageOCR(imageData);
      
      setResult(processResult);
      setDebugInfo(processDebugInfo);

      if (processResult.conduceNumber || processResult.facturaNumber) {
        const detectedValue = processResult.conduceNumber || processResult.facturaNumber;
        const detectionType = processResult.detectionType || 'conduce';
        
        console.log(`🎯 ${detectionType === 'conduce' ? 'Código de barras' : 'Número de factura'} detectado:`, detectedValue);
        
        toast({
          title: "✅ Código detectado",
          description: `${detectionType === 'conduce' ? 'Código' : 'Factura'}: ${detectedValue} (${processDebugInfo.processingTime}ms)`,
        });
        
        // Trigger delivery process immediately
        onConduceDetected(
          detectedValue!, 
          imageData, 
          detectionType,
          processResult.facturaNumber
        );
      } else {
        console.log('❌ No se detectó código válido en ninguna orientación');
        
        toast({
          title: "❌ Sin código detectado",
          description: "Intenta con una imagen más clara del código de barras o número de factura",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Error en procesamiento:', error);
      
      toast({
        title: "❌ Error de procesamiento",
        description: "Error durante el procesamiento. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('📁 Archivo seleccionado para compresión:', { 
        name: file.name, 
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB', 
        type: file.type 
      });

      // Comprimir imagen antes de procesarla
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        processImage(result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('❌ Error al comprimir imagen:', error);
      // Fallback: usar archivo original si falla la compresión
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        processImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = async () => {
    if (disabled || isProcessing) return;
    
    try {
      setPreview('');
      processImage('');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const clearCapture = () => {
    setPreview('');
    setResult(null);
    setDebugInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-3 bg-gray-50">
        <ImagePreview 
          preview={preview}
          isProcessing={isProcessing}
          onClear={clearCapture}
          onCameraClick={handleCameraClick}
        />
      </div>

      {result && (
        <ProcessingResult result={result} debugInfo={debugInfo} />
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => cameraInputRef.current?.click()} 
          disabled={disabled || isProcessing}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Capturar foto
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={disabled || isProcessing}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir foto
        </Button>
        
        {/* Input para cámara nativa */}
        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          capture="environment"
          className="hidden" 
        />
        
        {/* Input para subir archivo */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
};
