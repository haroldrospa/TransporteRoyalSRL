
import { Cliente } from '@/types/cliente';
import { Conduce, Region, EstadoBulto } from '@/types/conduces';

export const useDataFilters = (conduces: Conduce[], clientes: Cliente[]) => {
  
  const getClienteByNumero = (numeroCliente: string) => {
    const found = clientes.find(c => c.numeroCliente === numeroCliente);
    if (!found) {
      console.log(`Cliente with numero ${numeroCliente} not found among ${clientes.length} clientes`);
    }
    return found;
  };

  const getConducesByEncomendado = (encomendado: string) => {
    return conduces.filter(c => c.encomendado === encomendado && c.estado === 'En tránsito');
  };

  const getConducesByEstado = (estado: EstadoBulto) => {
    return conduces.filter(c => c.estado === estado);
  };

  const getConducesByRegion = (region: Region) => {
    return conduces.filter(c => c.region === region);
  };

  return {
    getClienteByNumero,
    getConducesByEncomendado,
    getConducesByEstado,
    getConducesByRegion
  };
};
