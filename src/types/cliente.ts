
export interface Cliente {
  id: string;
  rnc?: string;
  numeroCliente: string;
  razonSocial: string;
  ciudad: string;
  encomendado?: string;
  ruta?: string;
  contacto?: string;
  direccion?: string;  // Dirección escrita legible, ej: "Calle Roberto Colón #12"
  ubicacion?: string;  // Coordenadas GPS para Google Maps, ej: "18.4861,-69.9312"
  zona: 'Norte' | 'Sur' | 'Este';
  created_at?: string;
  updated_at?: string;
  grupo_cliente?: string;
}

