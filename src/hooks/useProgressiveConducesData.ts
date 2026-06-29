import { useState, useEffect, useCallback, useRef } from 'react';
import { Conduce } from '@/types/conduces';
import { 
  fetchConducesByLab, 
  fetchAllConducesNoLimit,
  fetchConduceImageProgressive,
  clearProgressiveCache 
} from '@/services/conduces/progressiveFetchConduces';

interface UseProgressiveConducesOptions {
  laboratorio?: 'LAM' | 'Fersuaz' | 'Taapharmaceutica' | 'Innovacion Quimica';
}

export function useProgressiveConducesData(options?: UseProgressiveConducesOptions) {
  const [conduces, setConduces] = useState<Conduce[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBackground, setLoadingBackground] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  const hasFetchedRef = useRef(false);
  const laboratorioRef = useRef(options?.laboratorio);
  
  // Actualizar ref cuando cambia el laboratorio
  useEffect(() => {
    laboratorioRef.current = options?.laboratorio;
  }, [options?.laboratorio]);

  // Función de carga - definida con useCallback estable
  const loadInitialData = useCallback(async (forceRefresh: boolean) => {
    if (hasFetchedRef.current && !forceRefresh) {
      return;
    }
    
    setLoading(true);
    setError(null);
    hasFetchedRef.current = true;
    
    try {
      if (forceRefresh) {
        clearProgressiveCache();
      }
      
      const lab = laboratorioRef.current;
      console.log(`🚀 Loading ${lab || 'ALL'} conduces...`);
      const startTime = performance.now();
      
      let data: Conduce[];
      
      if (lab) {
        data = await fetchConducesByLab(lab);
      } else {
        // Cargar TODOS los conduces sin límite
        data = await fetchAllConducesNoLimit((loaded, total) => {
          setProgress({ loaded, total });
        });
      }
      
      setConduces(data);
      
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Loaded ${data.length} conduces in ${duration}s`);
      
    } catch (err) {
      console.error('Error loading conduces:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar imagen de un conduce específico
  const loadConduceImage = useCallback(async (conduceId: string): Promise<string | null> => {
    if (loadingImages[conduceId]) {
      return null;
    }

    setLoadingImages(prev => ({ ...prev, [conduceId]: true }));
    
    try {
      const imageUrl = await fetchConduceImageProgressive(conduceId);
      
      if (imageUrl) {
        setConduces(prev => 
          prev.map(c => c.id === conduceId ? { ...c, imagen: imageUrl } : c)
        );
      }
      
      return imageUrl;
    } catch (err) {
      console.error(`Error loading image:`, err);
      return null;
    } finally {
      setLoadingImages(prev => ({ ...prev, [conduceId]: false }));
    }
  }, [loadingImages]);

  // Actualizar un conduce
  const updateConduce = useCallback((updatedConduce: Conduce) => {
    setConduces(prev => 
      prev.map(c => c.id === updatedConduce.id ? updatedConduce : c)
    );
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    hasFetchedRef.current = false;
    await loadInitialData(true);
  }, [loadInitialData]);

  // Efecto de carga inicial - solo ejecutar una vez
  useEffect(() => {
    loadInitialData(false);
  }, [loadInitialData]);

  return {
    conduces,
    loading,
    loadingBackground,
    progress,
    loadingImages,
    loadConduceImage,
    updateConduce,
    refresh,
    error
  };
}
