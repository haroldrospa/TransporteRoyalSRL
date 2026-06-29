-- Crear usuarios para acceso a la página de entregas
INSERT INTO public.usuarios (email, nombre, apellido, puesto, password, nivel, camion) VALUES
  ('chofer.r01@empresa.com', 'Carlos', 'García', 'Chofer', 'chofer123', 2, 'R-01'),
  ('chofer.r02@empresa.com', 'Luis', 'Martínez', 'Chofer', 'chofer123', 2, 'R-02'),
  ('chofer.r03@empresa.com', 'José', 'Rodríguez', 'Chofer', 'chofer123', 2, 'R-03'),
  ('chofer.r04@empresa.com', 'Miguel', 'López', 'Chofer', 'chofer123', 2, 'R-04'),
  ('chofer.r05@empresa.com', 'Antonio', 'González', 'Chofer', 'chofer123', 2, 'R-05'),
  ('chofer.r06@empresa.com', 'Francisco', 'Pérez', 'Chofer', 'chofer123', 2, 'R-06'),
  ('chofer.r07@empresa.com', 'David', 'Sánchez', 'Chofer', 'chofer123', 2, 'R-07'),
  ('supervisor.norte@empresa.com', 'Ana', 'Fernández', 'Supervisor', 'super123', 3, NULL),
  ('supervisor.sur@empresa.com', 'María', 'Torres', 'Supervisor', 'super123', 3, NULL),
  ('admin@empresa.com', 'Juan', 'Admin', 'Administrador', 'admin123', 5, NULL)
ON CONFLICT (email) DO NOTHING;