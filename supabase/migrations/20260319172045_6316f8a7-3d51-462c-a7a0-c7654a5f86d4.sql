UPDATE conduces 
SET 
  estado = 'Entregado',
  hora_entrega_exacta = now(),
  tiempo_entrega = '19h 45m',
  firma = 'BULK_DELIVERY',
  nota = 'Entrega masiva - marcado por sistema',
  updated_at = now()
WHERE estado = 'En tránsito' 
  AND encomendado = 'C-01';