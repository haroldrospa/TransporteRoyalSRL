-- Arreglar warning de seguridad para la función get_fast_count
DROP FUNCTION IF EXISTS get_fast_count(text);

CREATE OR REPLACE FUNCTION get_fast_count(table_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result bigint;
BEGIN
    EXECUTE 'SELECT reltuples::bigint FROM pg_class WHERE relname = $1' INTO result USING table_name;
    RETURN COALESCE(result, 0);
END;
$$;