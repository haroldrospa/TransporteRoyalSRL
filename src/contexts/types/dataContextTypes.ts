
import { Cliente } from '@/types/cliente';
import { Conduce, Region } from '@/types/conduces';

export interface DataContextType {
  conduces: Conduce[];
  clientes: Cliente[];
  regionActual: Region;
  loading: boolean;
  totalClientsCount: number | null;
  setRegionActual: (region: Region) => void;
  addConduce: (conduce: Omit<Conduce, 'id'>) => Promise<void>;
  updateConduce: (id: string, updates: Partial<Conduce>) => Promise<void>;
  addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<Cliente | null>;
  updateCliente: (id: string, updates: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  getClienteByNumero: (numeroCliente: string) => Cliente | null;
  getConducesByEncomendado: (encomendado: string) => Conduce[];
  getConducesByEstado: (estado: string) => Conduce[];
  getConducesByRegion: (region: Region) => Conduce[];
  asignarEncomendado: (conduceIds: string[], encomendado: string, prioridad?: boolean) => Promise<void>;
  entregarConduce: (conduceId: string, firma: string, nota?: string, imagen?: string) => Promise<void>;
  devolverConduce: (conduceId: string, data: any) => Promise<void>;
  refreshData: (force?: boolean) => Promise<void>;
  importMockData: () => Promise<void>;
  loadClientesByNumeros?: (numeros: string[]) => Promise<void>;
}
