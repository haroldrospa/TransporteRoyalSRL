-- Drop the problematic policies
DROP POLICY IF EXISTS "admins_can_read_all_users" ON public.usuarios;
DROP POLICY IF EXISTS "admins_can_read_all_users_future" ON public.usuarios;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = user_id 
      AND nivel >= 4 
      AND puesto = 'Administrador'
  );
$$;

-- Create new policies using the security definer function
CREATE POLICY "admins_can_manage_all_users"
ON public.usuarios
FOR ALL
USING (public.is_user_admin(auth.uid()));

-- Allow users to read their own data
CREATE POLICY "users_can_read_own_data"
ON public.usuarios
FOR SELECT
USING (id = auth.uid() OR public.is_user_admin(auth.uid()));