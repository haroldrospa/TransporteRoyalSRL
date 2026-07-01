
export interface Cliente {
  id: string;
  rnc?: string;
  numeroCliente: string;
  razonSocial: string;
  ciudad: string;
  encomendado?: string;
  ruta?: string;
  contacto?: string;
  ubicacion?: string;
  zona: 'Norte' | 'Sur' | 'Este';
  created_at?: string;
  updated_at?: string;
  grupo_cliente?: string;
}
