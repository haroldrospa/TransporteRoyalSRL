import { useState, useEffect, useCallback } from 'react';
import { Conduce, Region } from '@/types/conduces';
import { 
  getControlBultosDataWithCache, 
  fetchControlBultosData,
  clearControlBultosCache 
} from '@/services/controlBultos/fastControlBultosService';
import { useToast } from '@/hooks/use-toast';

export const useFastControlBultos = (regionActual: Region) => {
  const [allConduces, setAllConduces] = useState<Conduce[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Filter conduces by region
  const conduces = allConduces.filter(c => c.region === regionActual);
  
  console.log(`📊 [useFastControlBultos] Region: ${regionActual}, Total: ${allConduces.length}, Filtered: ${conduces.length}`);
  
  // Initial load with cache-first strategy
  const loadInitialData = useCallback(async () => {
    console.log('🔄 [useFastControlBultos] Loading initial data...');
    setLoading(true);
    
    try {
      // Get cached data first (instant)
      const { data, fromCache } = await getControlBultosDataWithCache();
      
      setAllConduces(data);
      setLoading(false);
      
      console.log(`✅ Initial data loaded: ${data.length} conduces ${fromCache ? '(from cache)' : '(fresh)'}`);
      
      // If we used cache, refresh in background
      if (fromCache && data.length > 0) {
        console.log('🔄 Refreshing data in background...');
        setRefreshing(true);
        
        // Small delay to let UI render first
        setTimeout(async () => {
          const freshData = await fetchControlBultosData();
          if (freshData.length > 0) {
            setAllConduces(freshData);
            console.log('✅ Background refresh complete:', freshData.length);
          }
          setRefreshing(false);
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Error loading control bultos data:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  // Manual refresh (force fresh data)
  const refreshData = useCallback(async (showToast = true) => {
    console.log('🔄 [useFastControlBultos] Manual refresh...');
    setRefreshing(true);
    
    try {
      clearControlBultosCache();
      const freshData = await fetchControlBultosData();
      setAllConduces(freshData);
      
      if (showToast) {
        toast({
          title: "Datos actualizados",
          description: `${freshData.length} conduces cargados`,
        });
      }
      
      console.log('✅ Manual refresh complete:', freshData.length);
    } catch (error) {
      console.error('❌ Error refreshing:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los datos",
          variant: "destructive"
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [toast]);
  
  // Update a conduce after assignment
  const updateConduce = useCallback((updatedConduce: Conduce) => {
    setAllConduces(prev => 
      prev.map(c => c.id === updatedConduce.id ? updatedConduce : c)
    );
  }, []);
  
  // Get conduces by encomendado
  const getConducesByEncomendado = useCallback((encomendado: string) => {
    return conduces.filter(c => c.encomendado === encomendado);
  }, [conduces]);
  
  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  return {
    conduces,
    allConduces,
    loading,
    refreshing,
    refreshData,
    updateConduce,
    getConducesByEncomendado
  };
};
