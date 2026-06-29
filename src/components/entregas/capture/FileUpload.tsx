
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';

interface FileUploadProps {
  onFileSelect: (imageData: string, file: File) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export const FileUpload = ({ onFileSelect, disabled = false, isProcessing = false }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        onFileSelect(result, compressedFile);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('❌ Error al comprimir imagen:', error);
      // Fallback: usar archivo original si falla la compresión
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onFileSelect(result, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isProcessing}
        className="flex-1"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Subir imagen
      </Button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </>
  );
};

export { FileUpload as default };
export const clearFileInput = (ref: React.RefObject<HTMLInputElement>) => {
  if (ref.current) {
    ref.current.value = '';
  }
};
