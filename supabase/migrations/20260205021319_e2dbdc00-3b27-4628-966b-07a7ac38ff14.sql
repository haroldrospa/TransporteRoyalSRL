-- Añadir campo laboratorio a la tabla usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS laboratorio text;

-- Actualizar usuarios existentes de LAM
UPDATE public.usuarios SET laboratorio = 'LAM' WHERE email LIKE '%LAM%' OR puesto = 'LAM';

-- Insertar usuarios LAM (LAMventas01 hasta LAMventas10)
INSERT INTO public.usuarios (email, nombre, apellido, password, nivel, puesto, laboratorio)
VALUES 
  ('LAMventas01@transroyal.com', 'LAM Ventas', '01', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas02@transroyal.com', 'LAM Ventas', '02', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas03@transroyal.com', 'LAM Ventas', '03', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas04@transroyal.com', 'LAM Ventas', '04', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas05@transroyal.com', 'LAM Ventas', '05', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas06@transroyal.com', 'LAM Ventas', '06', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas07@transroyal.com', 'LAM Ventas', '07', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas08@transroyal.com', 'LAM Ventas', '08', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas09@transroyal.com', 'LAM Ventas', '09', 'lam2025', 2, 'LAM', 'LAM'),
  ('LAMventas10@transroyal.com', 'LAM Ventas', '10', 'lam2025', 2, 'LAM', 'LAM')
ON CONFLICT (email) DO NOTHING;

-- Insertar usuarios Fersuaz
INSERT INTO public.usuarios (email, nombre, apellido, password, nivel, puesto, laboratorio)
VALUES 
  ('Fersuaz@transroyal.com', 'Fersuaz', 'Admin', 'fersuaz2025', 2, 'Laboratorio', 'Fersuaz'),
  ('Fersuazventas01@transroyal.com', 'Fersuaz Ventas', '01', 'fersuaz2025', 2, 'Laboratorio', 'Fersuaz'),
  ('Fersuazventas02@transroyal.com', 'Fersuaz Ventas', '02', 'fersuaz2025', 2, 'Laboratorio', 'Fersuaz')
ON CONFLICT (email) DO NOTHING;