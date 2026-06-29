-- Añadir columna para marcar si la relación fue enviada al laboratorio
ALTER TABLE public.relacion_conduces_fechas 
ADD COLUMN IF NOT EXISTS enviado_laboratorio boolean DEFAULT false;

-- Añadir columna para la fecha en que se envió al laboratorio
ALTER TABLE public.relacion_conduces_fechas 
ADD COLUMN IF NOT EXISTS fecha_envio_laboratorio timestamp with time zone DEFAULT NULL;