-- Crear usuario principal para el laboratorio Krishpar Care Dominicana
INSERT INTO public.usuarios (email, nombre, apellido, password, nivel, puesto, laboratorio)
VALUES ('krishpar@transporteroyal.com', 'Krishpar Care', 'Dominicana', 'Krishpar2026!', 2, 'Laboratorio', 'Krishpar Care Dominicana')
ON CONFLICT (email) DO NOTHING;
