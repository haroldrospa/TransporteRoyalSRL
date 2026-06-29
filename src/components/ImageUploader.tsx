
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { compressImage } from '@/utils/imageCompression';

interface ImageUploaderProps {
  onImageCapture: (imageDataUrl: string) => void;
  initialImage?: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageCapture,
  initialImage,
  className
}) => {
  const [preview, setPreview] = useState<string | undefined>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

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
        onImageCapture(result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('❌ Error al comprimir imagen:', error);
      // Fallback: usar archivo original si falla la compresión
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreview(undefined);
    onImageCapture('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col items-center w-full ${className || ''}`}>
      <div className="border-2 border-dashed rounded-md p-2 bg-gray-50 w-full text-center">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-60 max-w-full mx-auto object-contain" />
            <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={clearImage}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-4">
              Suba una imagen
            </p>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={() => cameraInputRef.current?.click()} 
          type="button" 
          className="flex-1 min-w-[120px]"
        >
          <Camera className="h-4 w-4 mr-1" />
          Capturar foto
        </Button>
        
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={() => fileInputRef.current?.click()} 
          type="button" 
          className="flex-1 min-w-[120px]"
        >
          <Upload className="h-4 w-4 mr-1" />
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

export default ImageUploader;
