
// Main clienteService file that re-exports all functionality
import { fetchClientes } from './clientes/fetchClientes';
import { addCliente, updateCliente, deleteCliente } from './clientes/crudOperations';

export {
  fetchClientes,
  addCliente,
  updateCliente,
  deleteCliente
};
