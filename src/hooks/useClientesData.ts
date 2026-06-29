import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { Cliente } from '@/types/cliente';
import { ClienteFormSchema } from '@/components/ClienteForm';

export const useClientesData = () => {
  const { clientes, addCliente, updateCliente, deleteCliente, refreshData, totalClientsCount } = useData();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  const [hasNoClientes, setHasNoClientes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [showAllTypes, setShowAllTypes] = useState(true);
  const [emptyClientes, setEmptyClientes] = useState<Cliente[]>([]);
  
  // Check if there are any clients
  const checkEmptyClientes = useCallback(async () => {
    const isEmpty = clientes.length === 0;
    setHasNoClientes(isEmpty);
    return isEmpty;
  }, [clientes]);
  
  // Handle adding a new client
  const handleAddCliente = async (cliente: Omit<Cliente, 'id'>) => {
    setIsLoading(true);
    try {
      await addCliente(cliente);
      toast({ 
        title: "Cliente agregado con éxito",
        description: `${cliente.razonSocial} ha sido añadido a la base de datos.`
      });
      await refreshData(true);
    } catch (error) {
      console.error('Error adding cliente:', error);
      toast({ 
        title: "Error",
        description: "No se pudo agregar el cliente. Intente de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle updating a client
  const handleUpdateCliente = async (id: string, cliente: ClienteFormSchema) => {
    setIsLoading(true);
    try {
      await updateCliente(id, cliente);
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente"
      });
      await refreshData();
    } catch (error) {
      console.error('Error updating cliente:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle deleting a client
  const handleDeleteCliente = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteCliente(id);
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente"
      });
      await refreshData();
    } catch (error) {
      console.error('Error deleting cliente:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Force refresh all data
  const handleForceRefresh = async () => {
    setIsForceRefreshing(true);
    try {
      console.log("Forzando actualización completa de datos...");
      // Properly call refreshData with the force parameter
      await refreshData(true);
      await checkEmptyClientes();
      
      // Log and store the total count
      console.log(`${clientes.length} clientes cargados`);
      
      toast({
        title: "Datos actualizados",
        description: `${clientes.length} clientes han sido cargados.`
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos. Intente de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsForceRefreshing(false);
    }
  };
  
  // Regular refresh
  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // Call refreshData without the force parameter
      await refreshData();
      await checkEmptyClientes();
      toast({
        title: "Datos actualizados",
        description: `${clientes.length} clientes han sido cargados.`
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    clientes,
    loading: isLoading,
    isLoading,
    isForceRefreshing,
    hasNoClientes,
    emptyClientes,
    searchTerm,
    setSearchTerm,
    filterField,
    setFilterField,
    showAllTypes,
    setShowAllTypes,
    handleAddCliente,
    handleUpdateCliente,
    handleDeleteCliente,
    handleForceRefresh,
    forceRefreshData: handleForceRefresh,
    handleRefreshData,
    checkEmptyClientes,
    totalClientsInDatabase: totalClientsCount
  };
};
