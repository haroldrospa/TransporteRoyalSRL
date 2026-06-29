
export type PuestoType = 'Administrador' | 'Chofer' | 'Laboratorio' | 'Despachador' | 'LAM';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  password?: string;
  nivel: number;
  puesto: PuestoType;
  camion?: string;
  laboratorio?: string;
}

export type UsuarioFormData = Omit<Usuario, 'id'>;
