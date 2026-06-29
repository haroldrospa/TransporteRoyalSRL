-- Fix security errors by adding search_path and enabling RLS

-- Fix function security: Add search_path to functions
CREATE OR REPLACE FUNCTION public.actualizar_contador_relacion_fecha()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Actualizar los contadores en la tabla de relaciones por fecha
  UPDATE public.relacion_conduces_fechas 
  SET 
    conduces_entregados = conduces_entregados + 1,
    conduces_pendientes = conduces_pendientes - 1,
    conduces_entregados_lista = array_append(conduces_entregados_lista, NEW.conduce_number),
    updated_at = now()
  WHERE relacion_id = NEW.relacion_id 
    AND fecha_relacion = DATE(NEW.fecha_entrega);
    
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Enable RLS on rutas_asignaciones table
ALTER TABLE public.rutas_asignaciones ENABLE ROW LEVEL SECURITY;

-- Create policy for rutas_asignaciones
CREATE POLICY "Allow full access to rutas_asignaciones" 
ON public.rutas_asignaciones 
FOR ALL 
USING (true) 
WITH CHECK (true);