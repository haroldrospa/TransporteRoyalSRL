
-- Crear tabla para almacenar las relaciones de conduces con fechas
CREATE TABLE public.relacion_conduces_fechas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relacion_id UUID REFERENCES public.relaciones_conduces(id) NOT NULL,
  fecha_relacion DATE NOT NULL,
  total_conduces INTEGER NOT NULL DEFAULT 0,
  conduces_entregados INTEGER NOT NULL DEFAULT 0,
  conduces_pendientes INTEGER NOT NULL DEFAULT 0,
  lista_conduces TEXT[] NOT NULL DEFAULT '{}', -- Array de números de conduce
  conduces_entregados_lista TEXT[] NOT NULL DEFAULT '{}', -- Array de conduces ya entregados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(relacion_id, fecha_relacion)
);

-- Habilitar RLS
ALTER TABLE public.relacion_conduces_fechas ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver las relaciones con fechas
CREATE POLICY "Todos pueden ver relaciones con fechas"
  ON public.relacion_conduces_fechas
  FOR SELECT
  USING (true);

-- Política para que usuarios autenticados puedan insertar
CREATE POLICY "Usuarios pueden crear relaciones con fechas"
  ON public.relacion_conduces_fechas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid()
    )
  );

-- Política para que usuarios puedan actualizar
CREATE POLICY "Usuarios pueden actualizar relaciones con fechas"
  ON public.relacion_conduces_fechas
  FOR UPDATE
  USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_relacion_conduces_fechas_updated_at 
  BEFORE UPDATE ON public.relacion_conduces_fechas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar automáticamente los contadores cuando se registra un conduce
CREATE OR REPLACE FUNCTION actualizar_contador_relacion_fecha()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta cuando se inserta un nuevo registro en control_conduces
CREATE TRIGGER trigger_actualizar_contador_relacion_fecha
  AFTER INSERT ON public.control_conduces
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_contador_relacion_fecha();
