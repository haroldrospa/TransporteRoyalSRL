
import { Cliente } from '@/types/cliente';
import * as clienteService from '@/services/clienteService';

export const useClienteOperations = (
  clientes: Cliente[], 
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>
) => {
  
  const addCliente = async (cliente: Omit<Cliente, 'id'>) => {
    try {
      const newCliente = await clienteService.addCliente(cliente);
      if (newCliente) {
        setClientes(prevClientes => [...prevClientes, newCliente]);
      }
      return newCliente;
    } catch (error) {
      console.error('Error adding cliente:', error);
      throw error;
    }
  };

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    try {
      await clienteService.updateCliente(id, updates);
      setClientes(prevClientes => prevClientes.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (error) {
      console.error('Error updating cliente:', error);
      throw error;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      const success = await clienteService.deleteCliente(id);
      if (!success) {
        throw new Error('No se pudo eliminar el cliente de la base de datos');
      }
      setClientes(prevClientes => prevClientes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting cliente:', error);
      throw error;
    }
  };

  return {
    addCliente,
    updateCliente,
    deleteCliente
  };
};
