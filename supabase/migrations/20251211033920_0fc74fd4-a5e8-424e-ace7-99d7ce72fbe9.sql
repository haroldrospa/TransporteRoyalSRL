-- Eliminar la constraint única de numero_conduce para permitir duplicados
ALTER TABLE public.conduces DROP CONSTRAINT IF EXISTS conduces_numero_conduce_key;

-- Crear un índice normal (no único) para mantener el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS idx_conduces_numero_conduce ON public.conduces USING btree (numero_conduce);