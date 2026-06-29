-- Create table for LAM deliveries (entregas LAM)
CREATE TABLE public.entregas_lam (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente TEXT NOT NULL DEFAULT 'Laboratorio LAM',
  cantidad_bultos INTEGER NOT NULL,
  firma_despachador TEXT NOT NULL,
  imagen_conduce TEXT NOT NULL,
  fecha_recogida TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usuario_id UUID,
  usuario_nombre TEXT,
  notas TEXT
);

-- Enable Row Level Security
ALTER TABLE public.entregas_lam ENABLE ROW LEVEL SECURITY;

-- Create policies for entregas_lam
CREATE POLICY "Enable read access for all users"
  ON public.entregas_lam
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON public.entregas_lam
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON public.entregas_lam
  FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete for all users"
  ON public.entregas_lam
  FOR DELETE
  USING (true);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_entregas_lam_updated_at
  BEFORE UPDATE ON public.entregas_lam
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries by date
CREATE INDEX idx_entregas_lam_fecha_recogida ON public.entregas_lam(fecha_recogida DESC);
CREATE INDEX idx_entregas_lam_cliente ON public.entregas_lam(cliente);