
-- Agregar columna relacion a la tabla conduces
ALTER TABLE public.conduces 
ADD COLUMN relacion TEXT;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_conduces_relacion ON public.conduces(relacion);
