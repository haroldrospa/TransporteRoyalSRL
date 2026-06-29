-- Poblar datos existentes (corregido)
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
  COALESCE(
    array_agg(c.numero_conduce) 
    FILTER (WHERE c.estado = 'Entregado'), 
    ARRAY[]::text[]
  ) as conduces_entregados_lista
FROM conduces c
JOIN relaciones_conduces r ON r.nombre = c.relacion
WHERE c.relacion IS NOT NULL AND c.relacion != ''
GROUP BY r.id, DATE(c.fecha_entrega::date)
ON CONFLICT (relacion_id, fecha_relacion) DO NOTHING;