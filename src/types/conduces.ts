
export type Region = 'Norte' | 'Sur' | 'Este';

export type EstadoBulto = 'En tránsito' | 'Entregado' | 'Devuelto';

export type Conduce = {
  id: string;
  numeroConduce: string;
  numeroFactura: string;
  numeroCliente: string;
  cantidadBultos: number;
  cantidadEntregados?: number; // New field for tracking delivered bultos
  bultoModificado?: boolean; // Flag to indicate bultos were modified
  bultoModificacionNota?: string; // Note explaining the modification
  fechaCarga: string;
  fechaEntrega: string;
  razonSocial?: string;
  ciudad?: string;
  estado: EstadoBulto;
  laboratorio: string;
  encomendado?: string;
  prioridad?: boolean;
  tiempoEntrega?: string;
  horaEntregaExacta?: string; // Nueva field para la hora exacta de entrega
  firma?: string;
  nota?: string;
  imagen?: string;
  region: Region;
  excepcion?: boolean;
  motivoExcepcion?: string;
  ubicacion?: string;
  ruta?: string;
  relacion?: string; // Nueva columna para la relación
};
