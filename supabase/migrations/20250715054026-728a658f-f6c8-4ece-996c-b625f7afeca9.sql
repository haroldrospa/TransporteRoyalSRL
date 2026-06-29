-- Poblar la tabla relacion_conduces_fechas con datos de conduces existentes
-- Convertir fechas de formato DD/MM/YYYY a formato DATE
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
  TO_DATE(c.fecha_entrega, 'DD/MM/YYYY') as fecha_relacion,
  COUNT(*) as total_conduces,
  COUNT(CASE WHEN c.estado = 'Entregado' THEN 1 END) as conduces_entregados,
  COUNT(CASE WHEN c.estado != 'Entregado' THEN 1 END) as conduces_pendientes,
  ARRAY_AGG(c.numero_conduce ORDER BY c.numero_conduce) as lista_conduces,
  COALESCE(ARRAY_AGG(CASE WHEN c.estado = 'Entregado' THEN c.numero_conduce END) FILTER (WHERE c.estado = 'Entregado'), '{}') as conduces_entregados_lista
FROM conduces c
JOIN relaciones_conduces r ON r.nombre = c.relacion
WHERE c.relacion IS NOT NULL
GROUP BY r.id, TO_DATE(c.fecha_entrega, 'DD/MM/YYYY')
ON CONFLICT (relacion_id, fecha_relacion) 
DO UPDATE SET
  total_conduces = EXCLUDED.total_conduces,
  conduces_entregados = EXCLUDED.conduces_entregados,
  conduces_pendientes = EXCLUDED.conduces_pendientes,
  lista_conduces = EXCLUDED.lista_conduces,
  conduces_entregados_lista = EXCLUDED.conduces_entregados_lista,
  updated_at = NOW();