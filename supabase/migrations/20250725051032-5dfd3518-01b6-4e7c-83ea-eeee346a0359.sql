-- Optimizar índices para mejor rendimiento en consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_conduces_fecha_entrega ON conduces(fecha_entrega DESC);
CREATE INDEX IF NOT EXISTS idx_conduces_estado ON conduces(estado);
CREATE INDEX IF NOT EXISTS idx_conduces_encomendado ON conduces(encomendado);
CREATE INDEX IF NOT EXISTS idx_conduces_region ON conduces(region);
CREATE INDEX IF NOT EXISTS idx_conduces_created_at ON conduces(created_at DESC);

-- Índice compuesto para búsquedas por estado y región
CREATE INDEX IF NOT EXISTS idx_conduces_estado_region ON conduces(estado, region);

-- Índice para búsquedas de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_numero_cliente ON clientes(numero_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_razon_social ON clientes(razon_social);

-- Función optimizada para contar registros sin locks
CREATE OR REPLACE FUNCTION get_fast_count(table_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result bigint;
BEGIN
    EXECUTE 'SELECT reltuples::bigint FROM pg_class WHERE relname = $1' INTO result USING table_name;
    RETURN COALESCE(result, 0);
END;
$$;