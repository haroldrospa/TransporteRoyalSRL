
// Función para generar múltiples versiones optimizadas de la imagen
export function generateOptimizedVersions(imageData: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const optimizedVersions: string[] = [];
      
      if (!ctx) {
        resolve([imageData]);
        return;
      }
      
      // Dimensiones optimizadas para OCR
      const targetWidth = 1600;
      const targetHeight = 1200;
      let { width, height } = img;
      
      // Mantener relación de aspecto mientras escalamos
      const scale = Math.min(targetWidth / width, targetHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      
      canvas.width = width;
      canvas.height = height;
      
      // Configuraciones de optimización para diferentes tipos de imagen
      const optimizations = [
        // Versión con alto contraste
        { contrast: 2.0, brightness: 1.3, saturate: 0, blur: 0 },
        // Versión con contraste medio y nitidez
        { contrast: 1.8, brightness: 1.2, saturate: 0, blur: 0 },
        // Versión invertida (para códigos claros en fondo oscuro)
        { contrast: 1.5, brightness: 1.1, saturate: 0, blur: 0, invert: true },
        // Versión suavizada para imágenes con ruido
        { contrast: 1.6, brightness: 1.1, saturate: 0, blur: 0.5 },
      ];
      
      optimizations.forEach((opt, index) => {
        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Aplicar filtros
        let filterString = `contrast(${opt.contrast}) brightness(${opt.brightness}) saturate(${opt.saturate})`;
        if (opt.blur && opt.blur > 0) {
          filterString += ` blur(${opt.blur}px)`;
        }
        if (opt.invert) {
          filterString += ` invert(1)`;
        }
        
        ctx.filter = filterString;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Aplicar procesamiento adicional para mejorar la detección
        if (index < 2) { // Solo para las primeras dos versiones
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Binarización adaptativa simple
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const binary = gray > 128 ? 255 : 0;
            data[i] = binary;     // R
            data[i + 1] = binary; // G
            data[i + 2] = binary; // B
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        optimizedVersions.push(canvas.toDataURL('image/jpeg', 0.9));
      });
      
      resolve(optimizedVersions);
    };
    img.src = imageData;
  });
}

// Función para generar múltiples orientaciones de la imagen
export function generateRotatedVersions(imageData: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rotatedVersions: string[] = [];
      
      if (!ctx) {
        resolve([imageData]);
        return;
      }
      
      // Dimensiones originales
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Generar versiones rotadas: 0°, 90°, 180°, 270°
      const rotations = [0, 90, 180, 270];
      
      rotations.forEach(angle => {
        // Ajustar dimensiones del canvas según la rotación
        if (angle === 90 || angle === 270) {
          canvas.width = originalHeight;
          canvas.height = originalWidth;
        } else {
          canvas.width = originalWidth;
          canvas.height = originalHeight;
        }
        
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Aplicar transformación
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2);
        ctx.restore();
        
        rotatedVersions.push(canvas.toDataURL('image/jpeg', 0.85));
      });
      
      resolve(rotatedVersions);
    };
    img.src = imageData;
  });
}

// Función principal que combina optimización y rotación
export function optimizeImageForOCR(imageData: string): Promise<string[]> {
  return new Promise(async (resolve) => {
    try {
      // Primero optimizar la imagen
      const optimizedVersions = await generateOptimizedVersions(imageData);
      
      // Luego generar rotaciones de cada versión optimizada
      const allVersions: string[] = [];
      
      for (const optimized of optimizedVersions) {
        const rotated = await generateRotatedVersions(optimized);
        allVersions.push(...rotated);
      }
      
      resolve(allVersions);
    } catch (error) {
      console.error('Error optimizing image:', error);
      resolve([imageData]);
    }
  });
}
