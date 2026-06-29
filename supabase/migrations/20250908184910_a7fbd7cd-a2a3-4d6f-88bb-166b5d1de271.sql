-- Remove the dangerous public read policy that exposes employee data
DROP POLICY IF EXISTS "public_read_for_login" ON public.usuarios;

-- The check_user_credentials function already uses SECURITY DEFINER
-- which allows it to bypass RLS policies, so we don't need public access

-- Add a more restrictive policy for authenticated users only
CREATE POLICY "authenticated_users_can_read_own_data" 
ON public.usuarios 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Add a policy for admins to read all user data
CREATE POLICY "admins_can_read_all_users" 
ON public.usuarios 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND nivel >= 4 
    AND puesto = 'Administrador'
  )
);