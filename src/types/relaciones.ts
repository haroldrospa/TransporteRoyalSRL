
export interface RelacionConduceFecha {
  id: string;
  relacionId: string;
  fechaRelacion: string;
  fechaCarga?: string; // Nueva propiedad para fecha de carga
  totalConduces: number;
  conducesEntregados: number;
  conducesPendientes: number;
  listaConduces: string[];
  conducesEntregadosLista: string[];
  createdAt: string;
  updatedAt: string;
  conducesData?: any[]; // Datos completos de los conduces
  conducesEntregadosNave?: number; // Nuevo campo para conduces entregados a la nave
  conducesEntregadosNaveList?: string[]; // Lista de conduces entregados a la nave
  relacion: {
    nombre: string;
    descripcion: string;
  };
}

export interface ConducePendiente {
  numero_conduce: string;
  numero_cliente: string;
  razon_social?: string;
  cantidad_bultos: number;
  estado: string;
  fecha_entrega: string;
  fecha_carga?: string; // Nueva propiedad para fecha de carga
}
