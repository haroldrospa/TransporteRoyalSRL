
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, RotateCw, X } from 'lucide-react';

interface ImagePreviewProps {
  preview: string;
  isProcessing: boolean;
  onClear: () => void;
  onCameraClick?: () => void;
  onImageCapture?: (imageDataUrl: string) => void;
}

export const ImagePreview = ({ preview, isProcessing, onClear, onImageCapture }: ImagePreviewProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { compressImage } = await import('@/utils/imageCompression');
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (onImageCapture) {
          onImageCapture(result);
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('❌ Error al comprimir imagen:', error);
      // Fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (onImageCapture) {
          onImageCapture(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!preview) {
    return (
      <>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleFileUpload}
        >
          <div className="text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-3 text-sm">
              Capture o suba una imagen del conduce
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Funciona con conduces horizontales y verticales
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 mb-3">
              <RotateCw className="h-3 w-3" />
              <span>Detección automática en todas las orientaciones</span>
            </div>
            <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
              <p className="font-medium mb-1">🔍 Detección mejorada:</p>
              <p>• Múltiples filtros de imagen para mejor claridad</p>
              <p>• Procesamiento avanzado para imágenes borrosas</p>
              <p>• Detección automática en cualquier ángulo</p>
            </div>
            <div className="mt-3 text-xs text-gray-500 font-medium">
              👆 Toque aquí para subir imagen
            </div>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </>
    );
  }

  return (
    <div className="relative">
      <img 
        src={preview} 
        alt="Vista previa del conduce" 
        className="max-h-48 max-w-full mx-auto object-contain rounded"
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
          <div className="text-center text-white">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="font-medium text-sm">🔄 Análisis avanzado en progreso...</p>
            <p className="text-xs opacity-75">Múltiples configuraciones OCR</p>
            <div className="mt-2 text-xs opacity-90">
              <p>• Optimizando imagen para mejor detección</p>
              <p>• Probando múltiples orientaciones</p>
              <p>• Aplicando filtros especializados</p>
            </div>
          </div>
        </div>
      )}
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onClear}
      >
        ✕
      </Button>
    </div>
  );
};
