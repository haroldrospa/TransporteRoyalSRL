-- Crear función para obtener usuarios sin activar RLS
CREATE OR REPLACE FUNCTION public.get_usuarios_by_puesto(puesto_param text)
RETURNS SETOF usuarios
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.usuarios WHERE puesto = puesto_param;
$$;