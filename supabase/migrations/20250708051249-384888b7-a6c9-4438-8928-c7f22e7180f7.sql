-- Crear trigger para auto-generar registros en relacion_conduces_fechas
CREATE OR REPLACE FUNCTION auto_create_relacion_fecha()
RETURNS TRIGGER AS $$
DECLARE
  relacion_uuid UUID;
  fecha_entrega_date DATE;
BEGIN
  -- Solo procesar si el conduce tiene una relación asignada
  IF NEW.relacion IS NOT NULL AND NEW.relacion != '' THEN
    
    -- Obtener el UUID de la relación
    SELECT id INTO relacion_uuid 
    FROM relaciones_conduces 
    WHERE nombre = NEW.relacion;
    
    -- Si no existe la relación, salir
    IF relacion_uuid IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Convertir fecha_entrega a DATE
    fecha_entrega_date := DATE(NEW.fecha_entrega::date);
    
    -- Insertar o actualizar en relacion_conduces_fechas
    INSERT INTO relacion_conduces_fechas (
      relacion_id,
      fecha_relacion,
      total_conduces,
      conduces_entregados,
      conduces_pendientes,
      lista_conduces,
      conduces_entregados_lista
    )
    VALUES (
      relacion_uuid,
      fecha_entrega_date,
      1,
      CASE WHEN NEW.estado = 'Entregado' THEN 1 ELSE 0 END,
      CASE WHEN NEW.estado = 'Entregado' THEN 0 ELSE 1 END,
      ARRAY[NEW.numero_conduce],
      CASE WHEN NEW.estado = 'Entregado' THEN ARRAY[NEW.numero_conduce] ELSE ARRAY[]::text[] END
    )
    ON CONFLICT (relacion_id, fecha_relacion) 
    DO UPDATE SET
      total_conduces = relacion_conduces_fechas.total_conduces + 1,
      conduces_entregados = relacion_conduces_fechas.conduces_entregados + 
        (CASE WHEN NEW.estado = 'Entregado' THEN 1 ELSE 0 END),
      conduces_pendientes = relacion_conduces_fechas.conduces_pendientes + 
        (CASE WHEN NEW.estado = 'Entregado' THEN 0 ELSE 1 END),
      lista_conduces = array_append(relacion_conduces_fechas.lista_conduces, NEW.numero_conduce),
      conduces_entregados_lista = 
        CASE 
          WHEN NEW.estado = 'Entregado' THEN 
            array_append(relacion_conduces_fechas.conduces_entregados_lista, NEW.numero_conduce)
          ELSE relacion_conduces_fechas.conduces_entregados_lista
        END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para ejecutar la función
DROP TRIGGER IF EXISTS trigger_auto_create_relacion_fecha ON conduces;
CREATE TRIGGER trigger_auto_create_relacion_fecha
  AFTER INSERT OR UPDATE ON conduces
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_relacion_fecha();

-- Agregar constraint única en relacion_conduces_fechas
ALTER TABLE relacion_conduces_fechas 
ADD CONSTRAINT unique_relacion_fecha 
UNIQUE (relacion_id, fecha_relacion);

-- Poblar datos existentes
INSERT INTO relacion_conduces_fechas (
  relacion_id,
  fecha_relacion,
  total_conduces,
  conduces_entregados,
  conduces_pendientes,
  lista_conduces,
  conduces_entregados_lista
)
SELECT 
  r.id as relacion_id,
  DATE(c.fecha_entrega::date) as fecha_relacion,
  COUNT(*) as total_conduces,
  COUNT(CASE WHEN c.estado = 'Entregado' THEN 1 END) as conduces_entregados,
  COUNT(CASE WHEN c.estado != 'Entregado' THEN 1 END) as conduces_pendientes,
  array_agg(c.numero_conduce) as lista_conduces,
  array_agg(CASE WHEN c.estado = 'Entregado' THEN c.numero_conduce END) 
    FILTER (WHERE c.estado = 'Entregado') as conduces_entregados_lista
FROM conduces c
JOIN relaciones_conduces r ON r.nombre = c.relacion
WHERE c.relacion IS NOT NULL AND c.relacion != ''
GROUP BY r.id, DATE(c.fecha_entrega::date)
ON CONFLICT (relacion_id, fecha_relacion) DO NOTHING;