-- Create table for holidays
CREATE TABLE public.dias_festivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dias_festivos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage holidays
CREATE POLICY "Users can view holidays" 
ON public.dias_festivos 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create holidays" 
ON public.dias_festivos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update holidays" 
ON public.dias_festivos 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete holidays" 
ON public.dias_festivos 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dias_festivos_updated_at
BEFORE UPDATE ON public.dias_festivos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();