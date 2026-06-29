
-- Allow numero_cliente to be nullable in conduces
ALTER TABLE public.conduces ALTER COLUMN numero_cliente DROP NOT NULL;

-- Drop the existing foreign key and recreate with ON DELETE SET NULL
ALTER TABLE public.conduces DROP CONSTRAINT conduces_numero_cliente_fkey;

ALTER TABLE public.conduces 
  ADD CONSTRAINT conduces_numero_cliente_fkey 
  FOREIGN KEY (numero_cliente) 
  REFERENCES public.clientes(numero_cliente) 
  ON DELETE SET NULL;
