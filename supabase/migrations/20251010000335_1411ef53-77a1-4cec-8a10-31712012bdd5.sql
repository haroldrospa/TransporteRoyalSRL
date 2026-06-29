-- Add DELETE policy for verified_shipments
CREATE POLICY "Enable delete for all users" ON public.verified_shipments
  FOR DELETE USING (true);