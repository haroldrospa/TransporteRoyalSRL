
// Main clienteService file that re-exports all functionality
import { fetchClientes, getCachedClientes, saveClientesToCache, updateClienteInCache } from './clientes/fetchClientes';
import { addCliente, updateCliente, deleteCliente } from './clientes/crudOperations';

export {
  fetchClientes,
  getCachedClientes,
  saveClientesToCache,
  updateClienteInCache,
  addCliente,
  updateCliente,
  deleteCliente
};

