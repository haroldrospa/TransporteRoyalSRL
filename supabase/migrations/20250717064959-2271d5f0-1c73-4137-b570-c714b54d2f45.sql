-- Crear registros para relaciones del 16 de julio de 2025
INSERT INTO relacion_conduces_fechas 
(relacion_id, fecha_relacion, total_conduces, conduces_entregados, conduces_pendientes, lista_conduces, conduces_entregados_lista)
SELECT 
  rc.id as relacion_id,
  '2025-07-16' as fecha_relacion,
  COUNT(c.numero_conduce) as total_conduces,
  0 as conduces_entregados,
  COUNT(c.numero_conduce) as conduces_pendientes,
  array_agg(c.numero_conduce ORDER BY c.numero_conduce) as lista_conduces,
  ARRAY[]::text[] as conduces_entregados_lista
FROM conduces c
JOIN relaciones_conduces rc ON c.relacion = rc.nombre
WHERE c.fecha_entrega = '16/07/2025' AND c.relacion IS NOT NULL
GROUP BY rc.id, rc.nombre;

-- Crear registros para relaciones del 17 de julio de 2025
INSERT INTO relacion_conduces_fechas 
(relacion_id, fecha_relacion, total_conduces, conduces_entregados, conduces_pendientes, lista_conduces, conduces_entregados_lista)
SELECT 
  rc.id as relacion_id,
  '2025-07-17' as fecha_relacion,
  COUNT(c.numero_conduce) as total_conduces,
  0 as conduces_entregados,
  COUNT(c.numero_conduce) as conduces_pendientes,
  array_agg(c.numero_conduce ORDER BY c.numero_conduce) as lista_conduces,
  ARRAY[]::text[] as conduces_entregados_lista
FROM conduces c
JOIN relaciones_conduces rc ON c.relacion = rc.nombre
WHERE c.fecha_entrega = '17/07/2025' AND c.relacion IS NOT NULL
GROUP BY rc.id, rc.nombre;