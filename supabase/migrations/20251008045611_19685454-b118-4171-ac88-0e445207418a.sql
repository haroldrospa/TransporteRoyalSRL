-- Drop restrictive policies
DROP POLICY IF EXISTS "clientes_no_direct_access" ON public.clientes;
DROP POLICY IF EXISTS "conduces_no_direct_access" ON public.conduces;
DROP POLICY IF EXISTS "pending_clientes_no_direct_access" ON public.pending_clientes;
DROP POLICY IF EXISTS "rutas_no_direct_access" ON public.rutas_asignaciones;
DROP POLICY IF EXISTS "usuarios_no_direct_access" ON public.usuarios;
DROP POLICY IF EXISTS "verified_shipments_no_direct_access" ON public.verified_shipments;

-- Create permissive policies for clientes
CREATE POLICY "Enable read access for all users" ON public.clientes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.clientes
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.clientes
  FOR DELETE USING (true);

-- Create permissive policies for conduces
CREATE POLICY "Enable read access for all users" ON public.conduces
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.conduces
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.conduces
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.conduces
  FOR DELETE USING (true);

-- Create permissive policies for pending_clientes
CREATE POLICY "Enable read access for all users" ON public.pending_clientes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.pending_clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.pending_clientes
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.pending_clientes
  FOR DELETE USING (true);

-- Create permissive policies for rutas_asignaciones
CREATE POLICY "Enable read access for all users" ON public.rutas_asignaciones
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.rutas_asignaciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.rutas_asignaciones
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.rutas_asignaciones
  FOR DELETE USING (true);

-- Create permissive policies for usuarios
CREATE POLICY "Enable read access for all users" ON public.usuarios
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.usuarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.usuarios
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.usuarios
  FOR DELETE USING (true);

-- Verified_shipments already has the correct permissive policies, just ensure they exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'verified_shipments' 
    AND policyname = 'Enable select for all users'
  ) THEN
    CREATE POLICY "Enable select for all users" ON public.verified_shipments
      FOR SELECT USING (true);
  END IF;
END $$;