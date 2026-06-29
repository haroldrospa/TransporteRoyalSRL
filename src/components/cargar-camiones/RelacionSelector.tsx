
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface Relacion {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface RelacionSelectorProps {
  selectedRelacion: string;
  onRelacionChange: (relacion: string) => void;
  disabled?: boolean;
}

const RelacionSelector = ({ 
  selectedRelacion, 
  onRelacionChange, 
  disabled = false 
}: RelacionSelectorProps) => {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
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
      
      setRelaciones(data || []);
    } catch (error) {
      console.error('Error loading relaciones:', error);
      // If no relations exist, create default ones
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
      
      setRelaciones(data || []);
    } catch (error) {
      console.error('Error creating default relations:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="relacion" className="text-sm font-medium">
        Seleccionar Relación
      </Label>
      <Select 
        value={selectedRelacion} 
        onValueChange={onRelacionChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Cargando relaciones..." : "Seleccionar relación..."} />
        </SelectTrigger>
        <SelectContent>
          {relaciones.map((relacion) => (
            <SelectItem key={relacion.id} value={relacion.nombre}>
              Relación {relacion.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RelacionSelector;
