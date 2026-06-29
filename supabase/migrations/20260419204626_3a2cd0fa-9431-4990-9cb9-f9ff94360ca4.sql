-- Corregir emails y nombres de las cuentas de ventas existentes
UPDATE public.usuarios
SET email = 'Taapharmaventas01@transporteroyal.com',
    nombre = 'Taapharma Ventas'
WHERE id = 'dd41cf10-ac55-4eb9-bfd1-77ed21e6afec';

UPDATE public.usuarios
SET email = 'Taapharmaventas02@transporteroyal.com',
    nombre = 'Taapharma Ventas'
WHERE id = '1b6deb3e-b24b-459c-be95-29475ce56d2d';

UPDATE public.usuarios
SET email = 'Taapharmaventas03@transporteroyal.com',
    nombre = 'Taapharma Ventas'
WHERE id = '7021b52d-cc2a-4046-a25d-160a456dfd7c';

-- Crear usuario principal de Taapharma (no de ventas)
INSERT INTO public.usuarios (email, nombre, apellido, password, nivel, puesto, laboratorio) VALUES
('taapharma@transporteroyal.com', 'Taapharma', 'Principal', 'Taapharma2026!', 2, 'Laboratorio', 'Taapharmaceutica');