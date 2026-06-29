-- Add RNC column to clientes table as the first data column (after id)
ALTER TABLE public.clientes 
ADD COLUMN rnc text;