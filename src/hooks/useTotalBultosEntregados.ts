import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTotalBultosEntregados = () => {
  const [totalBultosEntregados, setTotalBultosEntregados] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotalBultosEntregados = async () => {
      try {
        setLoading(true);
        console.log('Fetching total bultos entregados from database...');
        
        // Consulta directa para obtener todos los bultos entregados
        const { data, error } = await supabase
          .from('conduces')
          .select('cantidad_bultos')
          .eq('estado', 'Entregado');

        if (error) {
          console.error('Error fetching total bultos entregados:', error);
          return;
        }

        // Sumar todos los bultos entregados
        const total = data?.reduce((acc, conduce) => acc + (conduce.cantidad_bultos || 0), 0) || 0;
        
        console.log('Total bultos entregados from DB:', {
          totalConduces: data?.length || 0,
          totalBultos: total,
          sampleData: data?.slice(0, 5)
        });

        setTotalBultosEntregados(total);
      } catch (error) {
        console.error('Error in fetchTotalBultosEntregados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalBultosEntregados();
  }, []);

  return { totalBultosEntregados, loading };
};