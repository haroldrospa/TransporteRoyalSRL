-- Eliminar TODAS las políticas existentes de la tabla usuarios
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can update all users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can insert users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can delete users" ON public.usuarios;
DROP POLICY IF EXISTS "Allow admin operations on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Only admins can insert users" ON public.usuarios;
DROP POLICY IF EXISTS "Administrators can create users" ON public.usuarios;
DROP POLICY IF EXISTS "Administrators can delete users" ON public.usuarios;
DROP POLICY IF EXISTS "Administrators can update users" ON public.usuarios;
DROP POLICY IF EXISTS "Administrators can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can update users" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations for anon role" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.usuarios;
DROP POLICY IF EXISTS "Allow anonymous access for login" ON public.usuarios;
DROP POLICY IF EXISTS "Allow authenticated access for usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.usuarios;
DROP POLICY IF EXISTS "Allow unauthenticated user creation initially" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir lectura de usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir todas las operaciones para usuarios autenticados" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view their own data" ON public.usuarios;

-- Crear políticas simples sin recursión
-- Para acceso anónimo (necesario para login)
CREATE POLICY "public_read_for_login" 
ON public.usuarios 
FOR SELECT 
TO anon 
USING (true);

-- Para usuarios autenticados (acceso completo sin recursión)
CREATE POLICY "authenticated_full_access" 
ON public.usuarios 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);