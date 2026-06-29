import { useState, useEffect, useCallback } from 'react';
import { Conduce } from '@/types/conduces';
import { fetchConducesOptimized, fetchConduceImage, clearOptimizedCache } from '@/services/conduces/optimizedFetchConduces';
import { useToast } from '@/hooks/use-toast';

export const useOptimizedConducesData = () => {
  const [conduces, setConduces] = useState<Conduce[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Cargar todos los conduces sin imágenes
  const loadConduces = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (forceRefresh) {
        clearOptimizedCache();
      }
      
      const data = await fetchConducesOptimized(); // Sin límite
      setConduces(data);
      
      console.log(`📦 Loaded ${data.length} conduces without images`);
    } catch (error) {
      console.error('Error loading optimized conduces:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de conduces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cargar imagen específica de un conduce
  const loadConduceImage = useCallback(async (conduceId: string): Promise<string | null> => {
    if (loadingImages[conduceId]) {
      return null; // Ya se está cargando
    }

    setLoadingImages(prev => ({ ...prev, [conduceId]: true }));
    
    try {
      const imageUrl = await fetchConduceImage(conduceId);
      
      // Actualizar el conduce con la imagen cargada
      if (imageUrl) {
        setConduces(prev => 
          prev.map(conduce => 
            conduce.id === conduceId 
              ? { ...conduce, imagen: imageUrl }
              : conduce
          )
        );
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`Error loading image for conduce ${conduceId}:`, error);
      return null;
    } finally {
      setLoadingImages(prev => ({ ...prev, [conduceId]: false }));
    }
  }, [loadingImages]);

  // Actualizar un conduce específico
  const updateConduce = useCallback((updatedConduce: Conduce) => {
    setConduces(prev => 
      prev.map(conduce => 
        conduce.id === updatedConduce.id ? updatedConduce : conduce
      )
    );
  }, []);

  // Cargar datos iniciales sin límite
  useEffect(() => {
    loadConduces(false); // Cargar todos los datos desde el inicio
  }, [loadConduces]);

  return {
    conduces,
    loading,
    loadingImages,
    loadConduces,
    loadConduceImage,
    updateConduce,
    refresh: () => loadConduces(true)
  };
};