-- First, let's check current policies on verified_shipments
-- Add a policy to allow DELETE operations for all users (since this table is for shipment verification)

-- Enable delete policy for verified_shipments
CREATE POLICY "Allow all users to delete verified_shipments" 
ON public.verified_shipments 
FOR DELETE 
USING (true);

-- Also ensure update policy exists if needed
DROP POLICY IF EXISTS "Enable update for all users" ON public.verified_shipments;
CREATE POLICY "Enable update for all users" 
ON public.verified_shipments 
FOR UPDATE 
USING (true);