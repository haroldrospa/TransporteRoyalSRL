-- Crear índices para mejorar el rendimiento de las consultas
-- Índice para mejorar la consulta de conduces por estado y fecha
CREATE INDEX IF NOT EXISTS idx_conduces_estado_created_at ON public.conduces(estado, created_at DESC);

-- Índice para mejorar la consulta de conduces por región
CREATE INDEX IF NOT EXISTS idx_conduces_region_created_at ON public.conduces(region, created_at DESC);

-- Índice para mejorar la consulta de conduces por fecha de entrega
CREATE INDEX IF NOT EXISTS idx_conduces_fecha_entrega ON public.conduces(fecha_entrega);

-- Índice para mejorar la consulta de clientes por número
CREATE INDEX IF NOT EXISTS idx_clientes_numero ON public.clientes(numero_cliente);

-- Índice para mejorar la consulta de clientes por fecha de creación
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at DESC);