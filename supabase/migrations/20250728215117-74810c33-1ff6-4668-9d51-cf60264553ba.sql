-- Primero, eliminar todas las políticas existentes que pueden estar causando recursión
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can update all users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can insert users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can delete users" ON public.usuarios;

-- Crear nuevas políticas sin recursión usando funciones SECURITY DEFINER
CREATE POLICY "Allow admin operations on usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (
  -- Usar la función is_admin que ya existe y es SECURITY DEFINER
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política para insertar (solo admins)
CREATE POLICY "Only admins can insert users"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());