import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.5, // Máximo 500KB
  maxWidthOrHeight: 1024, // Máximo 1024px en cualquier dimensión
  useWebWorker: true,
  quality: 0.8 // 80% de calidad
};

export const compressImage = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    console.log('🗜️ Comprimiendo imagen:', {
      originalSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      originalName: file.name
    });

    const compressedFile = await imageCompression(file, finalOptions);
    
    console.log('✅ Compresión completada:', {
      originalSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      compressedSize: (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB',
      reduction: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + '%'
    });

    return compressedFile;
  } catch (error) {
    console.error('❌ Error al comprimir imagen:', error);
    throw error;
  }
};

export const compressImageDataURL = async (
  imageDataURL: string,
  options: CompressionOptions = {}
): Promise<string> => {
  try {
    // Convertir data URL a File
    const response = await fetch(imageDataURL);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
    
    // Comprimir el archivo
    const compressedFile = await compressImage(file, options);
    
    // Convertir de vuelta a data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('❌ Error al comprimir data URL:', error);
    throw error;
  }
};

export const resizeCanvas = (
  canvas: HTMLCanvasElement,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): string => {
  const { width: originalWidth, height: originalHeight } = canvas;
  
  let { width: newWidth, height: newHeight } = canvas;
  
  // Calcular nuevas dimensiones manteniendo la proporción
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    newWidth = originalWidth * ratio;
    newHeight = originalHeight * ratio;
  }
  
  // Si no hay cambio de tamaño, usar el canvas original
  if (newWidth === originalWidth && newHeight === originalHeight) {
    return canvas.toDataURL('image/jpeg', quality);
  }
  
  // Crear nuevo canvas con las dimensiones optimizadas
  const resizedCanvas = document.createElement('canvas');
  const ctx = resizedCanvas.getContext('2d');
  
  if (!ctx) {
    return canvas.toDataURL('image/jpeg', quality);
  }
  
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;
  
  // Dibujar imagen redimensionada
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  console.log('📐 Imagen redimensionada:', {
    original: `${originalWidth}x${originalHeight}`,
    optimized: `${newWidth}x${newHeight}`,
    quality: `${(quality * 100)}%`
  });
  
  return resizedCanvas.toDataURL('image/jpeg', quality);
};