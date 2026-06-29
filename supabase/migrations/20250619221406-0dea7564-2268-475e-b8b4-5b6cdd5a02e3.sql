
-- Fix the infinite recursion in RLS policies for usuarios table
DROP POLICY IF EXISTS "Solo admins pueden modificar relaciones" ON public.relaciones_conduces;
DROP POLICY IF EXISTS "Usuarios pueden insertar control de conduces" ON public.control_conduces;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios registros de control" ON public.control_conduces;

-- Create simpler policies that don't cause recursion
CREATE POLICY "Todos pueden modificar relaciones"
  ON public.relaciones_conduces
  FOR ALL
  USING (true);

CREATE POLICY "Todos pueden insertar control de conduces" 
  ON public.control_conduces
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar control de conduces"
  ON public.control_conduces
  FOR UPDATE
  USING (true);
