
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Relacion {
  id: string;
  nombre: string;
  descripcion?: string;
}

export const useRelaciones = () => {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [selectedRelacion, setSelectedRelacion] = useState<string>('1'); // Default to relation 1
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRelaciones();
  }, []);

  const loadRelaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('relaciones_conduces')
        .select('*')
        .in('nombre', ['1', '2', '3', '4']) // Only show relations 1, 2, 3, 4
        .order('nombre');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setRelaciones(data);
        // Set default selection to first relation if current selection doesn't exist
        if (!data.find(r => r.nombre === selectedRelacion)) {
          setSelectedRelacion(data[0].nombre);
        }
      } else {
        // Create default relations if none exist
        await createDefaultRelaciones();
      }
    } catch (error) {
      console.error('Error loading relaciones:', error);
      await createDefaultRelaciones();
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultRelaciones = async () => {
    try {
      const defaultRelaciones = [
        { nombre: '1', descripcion: 'Relación 1' },
        { nombre: '2', descripcion: 'Relación 2' },
        { nombre: '3', descripcion: 'Relación 3' },
        { nombre: '4', descripcion: 'Relación 4' }
      ];

      // First, delete any existing relations that are not 1, 2, 3, or 4
      await supabase
        .from('relaciones_conduces')
        .delete()
        .not('nombre', 'in', '(1,2,3,4)');

      const { data, error } = await supabase
        .from('relaciones_conduces')
        .upsert(defaultRelaciones, { onConflict: 'nombre' })
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setRelaciones(data);
        setSelectedRelacion(data[0].nombre);
      }
    } catch (error) {
      console.error('Error creating default relations:', error);
    }
  };

  return {
    relaciones,
    selectedRelacion,
    setSelectedRelacion,
    isLoading
  };
};
