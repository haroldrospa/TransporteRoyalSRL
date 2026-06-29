import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { Cliente } from '@/types/cliente';
import { ClienteFormSchema } from '@/components/ClienteForm';
import { 
  fetchClientesPaginated, 
  fetchClientesSinUbicacionCount,
  fetchClientesSinRncCount,
  fetchTotalClientesCount,
  PaginatedClientesResult 
} from '@/services/clientes/paginatedFetchClientes';
import { useDebouncedCallback } from 'use-debounce';

export const usePaginatedClientesData = () => {
  const { addCliente, updateCliente, deleteCliente, refreshData } = useData();
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [paginatedResult, setPaginatedResult] = useState<PaginatedClientesResult | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [showAllTypes, setShowAllTypes] = useState(true);
  
  // Stats
  const [totalClientsCount, setTotalClientsCount] = useState<number>(0);
  const [clientesSinUbicacion, setClientesSinUbicacion] = useState<number>(0);
  const [clientesSinRnc, setClientesSinRnc] = useState<number>(0);
  
  // Track if initial load is done
  const initialLoadDone = useRef(false);

  // Fetch paginated data
  const fetchData = useCallback(async (page: number, search?: string, field?: string) => {
    try {
      console.log(`🔄 Fetching page ${page} with search: "${search || 'none'}"`);
      
      const result = await fetchClientesPaginated(page, pageSize, search, field);
      setPaginatedResult(result);
      setCurrentPage(page);
      
      return result;
    } catch (error) {
      console.error('Error fetching paginated clientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
      return null;
    }
  }, [pageSize, toast]);

  // Debounced search to avoid too many requests
  const debouncedSearch = useDebouncedCallback(
    async (search: string, field: string) => {
      setIsSearching(true);
      await fetchData(1, search, field);
      setIsSearching(false);
    },
    300
  );

  // Handle search term change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSearch(value, filterField);
  }, [filterField, debouncedSearch]);

  // Handle filter field change
  const handleFilterFieldChange = useCallback((value: string) => {
    setFilterField(value);
    if (searchTerm) {
      debouncedSearch(searchTerm, value);
    }
  }, [searchTerm, debouncedSearch]);

  // Handle page change
  const handlePageChange = useCallback(async (page: number) => {
    setIsLoading(true);
    await fetchData(page, searchTerm, filterField);
    setIsLoading(false);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchData, searchTerm, filterField]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;
      
      console.log('🚀 Loading initial paginated clients data...');
      setIsLoading(true);
      
      try {
        // Load first page and stats in parallel
        const [result, total, sinUbicacion, sinRnc] = await Promise.all([
          fetchClientesPaginated(1, pageSize),
          fetchTotalClientesCount(),
          fetchClientesSinUbicacionCount(),
          fetchClientesSinRncCount()
        ]);
        
        setPaginatedResult(result);
        setTotalClientsCount(total);
        setClientesSinUbicacion(sinUbicacion);
        setClientesSinRnc(sinRnc);
        
        console.log(`✅ Initial load complete: ${result.clientes.length} clientes shown, ${total} total`);
      } catch (error) {
        console.error('Error in initial load:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [pageSize]);

  // Handle add cliente
  const handleAddCliente = async (cliente: Omit<Cliente, 'id'>) => {
    setIsLoading(true);
    try {
      await addCliente(cliente);
      toast({ 
        title: "Cliente agregado con éxito",
        description: `${cliente.razonSocial} ha sido añadido a la base de datos.`
      });
      // Refresh current page
      await fetchData(currentPage, searchTerm, filterField);
      // Update total count
      const total = await fetchTotalClientesCount();
      setTotalClientsCount(total);
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

  // Handle update cliente
  const handleUpdateCliente = async (id: string, cliente: ClienteFormSchema) => {
    setIsLoading(true);
    try {
      await updateCliente(id, cliente);
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente"
      });
      // Refresh current page
      await fetchData(currentPage, searchTerm, filterField);
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

  // Handle delete cliente
  const handleDeleteCliente = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteCliente(id);
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente"
      });
      // Refresh current page
      await fetchData(currentPage, searchTerm, filterField);
      // Update total count
      const total = await fetchTotalClientesCount();
      setTotalClientsCount(total);
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

  // Force refresh
  const handleForceRefresh = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Force refreshing clientes data...");
      
      const [result, total, sinUbicacion, sinRnc] = await Promise.all([
        fetchClientesPaginated(1, pageSize, searchTerm, filterField),
        fetchTotalClientesCount(),
        fetchClientesSinUbicacionCount(),
        fetchClientesSinRncCount()
      ]);
      
      setPaginatedResult(result);
      setTotalClientsCount(total);
      setClientesSinUbicacion(sinUbicacion);
      setClientesSinRnc(sinRnc);
      setCurrentPage(1);
      
      toast({
        title: "Datos actualizados",
        description: `${total} clientes en total.`
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
    // Data
    clientes: paginatedResult?.clientes || [],
    totalCount: paginatedResult?.totalCount || 0,
    
    // Pagination
    currentPage,
    totalPages: paginatedResult?.totalPages || 1,
    hasNextPage: paginatedResult?.hasNextPage || false,
    hasPrevPage: paginatedResult?.hasPrevPage || false,
    onPageChange: handlePageChange,
    
    // Loading states
    loading: isLoading,
    isLoading,
    isSearching,
    isForceRefreshing: isLoading,
    
    // Filters
    searchTerm,
    setSearchTerm: handleSearchChange,
    filterField,
    setFilterField: handleFilterFieldChange,
    showAllTypes,
    setShowAllTypes,
    
    // Stats
    totalClientsInDatabase: totalClientsCount,
    clientesSinUbicacion,
    clientesSinRnc,
    
    // Actions
    handleAddCliente,
    handleUpdateCliente,
    handleDeleteCliente,
    handleForceRefresh,
    forceRefreshData: handleForceRefresh,
    handleRefreshData: handleForceRefresh,
    
    // Legacy compatibility
    emptyClientes: [],
    hasNoClientes: totalClientsCount === 0,
    checkEmptyClientes: async () => totalClientsCount === 0
  };
};
