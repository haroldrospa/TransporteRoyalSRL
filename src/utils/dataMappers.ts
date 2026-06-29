
// Re-export all mappers for backward compatibility
import { mapDbClienteToCliente, mapClienteToDbCliente } from './mappers/clienteMappers';
import { mapDbConduceToConduce, mapConduceToDbConduce } from './mappers/conduceMappers';

export {
  mapDbClienteToCliente,
  mapClienteToDbCliente,
  mapDbConduceToConduce,
  mapConduceToDbConduce
};
