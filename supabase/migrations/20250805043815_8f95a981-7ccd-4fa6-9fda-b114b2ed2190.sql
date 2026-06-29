-- Agregar columna para almacenar la fecha y hora exacta de entrega
ALTER TABLE public.conduces 
ADD COLUMN hora_entrega_exacta TIMESTAMP WITH TIME ZONE;