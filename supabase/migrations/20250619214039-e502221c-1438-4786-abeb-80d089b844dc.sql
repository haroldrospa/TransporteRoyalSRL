
-- Crear tabla para las relaciones de conduces
CREATE TABLE public.relaciones_conduces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para el control de conduces entregados
CREATE TABLE public.control_conduces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conduce_number TEXT NOT NULL,
  relacion_id UUID REFERENCES public.relaciones_conduces(id) NOT NULL,
  fecha_entrega TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usuario_id UUID REFERENCES public.usuarios(id),
  estado TEXT NOT NULL DEFAULT 'entregado',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conduce_number, relacion_id)
);

-- Insertar las relaciones 1, 2, 3
INSERT INTO public.relaciones_conduces (nombre, descripcion) VALUES
('1', 'Relación 1'),
('2', 'Relación 2'),
('3', 'Relación 3');

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.relaciones_conduces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_conduces ENABLE ROW LEVEL SECURITY;

-- Políticas para relaciones_conduces (lectura para todos)
CREATE POLICY "Todos pueden ver relaciones"
  ON public.relaciones_conduces
  FOR SELECT
  USING (true);

CREATE POLICY "Solo admins pueden modificar relaciones"
  ON public.relaciones_conduces
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND nivel >= 4
    )
  );

-- Políticas para control_conduces
CREATE POLICY "Usuarios pueden ver control de conduces"
  ON public.control_conduces
  FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden insertar control de conduces"
  ON public.control_conduces
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar sus propios registros de control"
  ON public.control_conduces
  FOR UPDATE
  USING (usuario_id = auth.uid());

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_relaciones_conduces_updated_at 
  BEFORE UPDATE ON public.relaciones_conduces 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_conduces_updated_at 
  BEFORE UPDATE ON public.control_conduces 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
