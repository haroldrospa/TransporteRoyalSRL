import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface LazyImageDisplayProps {
  imageUrl?: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  placeholder?: React.ReactNode;
}

export const LazyImageDisplay = ({
  imageUrl,
  alt = "Imagen de entrega",
  className = "w-full h-auto max-h-32 object-contain rounded",
  onLoad,
  placeholder
}: LazyImageDisplayProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      setError(false);
      setImageSrc(null);
      return;
    }

    setLoading(true);
    setError(false);

    // Precargar la imagen
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(imageUrl);
      setLoading(false);
      setError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setLoading(false);
      setError(true);
      setImageSrc(null);
    };
    
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, onLoad]);

  if (!imageUrl && !loading) {
    return placeholder || (
      <div className="w-full h-full flex flex-col items-center justify-center border rounded p-4 bg-muted/50 text-center">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sin imagen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center border rounded p-4 bg-muted/50 text-center">
        <Loader2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando imagen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center border rounded p-4 bg-destructive/10 text-center">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-destructive">Error cargando imagen</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <img 
        src={imageSrc!} 
        alt={alt} 
        className={className}
        loading="lazy"
      />
    </div>
  );
};