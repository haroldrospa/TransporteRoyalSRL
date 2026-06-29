export interface EntregaLAM {
  id: string;
  cliente: string;
  cantidad_bultos: number;
  firma_despachador: string;
  imagen_conduce: string;
  fecha_recogida: string;
  created_at: string;
  updated_at: string;
  usuario_id?: string;
  usuario_nombre?: string;
  notas?: string;
}
