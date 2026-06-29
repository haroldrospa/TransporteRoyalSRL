-- Add fecha_carga column to relacion_conduces_fechas table
ALTER TABLE relacion_conduces_fechas 
ADD COLUMN fecha_carga date;

-- Add index for better query performance
CREATE INDEX idx_relacion_conduces_fechas_fecha_carga 
ON relacion_conduces_fechas(fecha_carga DESC);