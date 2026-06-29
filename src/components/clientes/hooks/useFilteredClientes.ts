
import { useMemo } from 'react';
import { Cliente } from '@/types/cliente';
import { isVisitador, matchesClientType } from '@/components/clientes/utils/clienteTypeUtils';

interface UseFilteredClientesProps {
  clientes: Cliente[];
  searchTerm: string;
  filterField: string;
  showAllTypes: boolean;
}

export const useFilteredClientes = ({
  clientes,
  searchTerm,
  filterField,
  showAllTypes
}: UseFilteredClientesProps) => {

  const filteredClientes = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) {
      console.log('No clientes available or invalid data format');
      return [];
    }

    console.log(`Total clients loaded: ${clientes.length}`);
    
    // First filter by search term if it exists
    let filtered = clientes;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Special case: if searching directly for "601515" or other specific IDs
      if (searchTerm.match(/^\d+$/)) {
        console.log(`Searching for specific ID: ${searchTerm}`);
        filtered = clientes.filter(cliente => 
          cliente.numeroCliente && cliente.numeroCliente.includes(searchTerm)
        );
        console.log(`Found ${filtered.length} clients with ID containing ${searchTerm}`);
        return filtered;
      }
      
      if (filterField === 'all') {
        filtered = clientes.filter(cliente => {
          return (
            (cliente.numeroCliente && cliente.numeroCliente.toLowerCase().includes(searchLower)) ||
            (cliente.razonSocial && cliente.razonSocial.toLowerCase().includes(searchLower)) ||
            (cliente.ciudad && cliente.ciudad.toLowerCase().includes(searchLower)) ||
            (cliente.zona && cliente.zona.toLowerCase().includes(searchLower)) ||
            (cliente.encomendado && cliente.encomendado.toLowerCase().includes(searchLower)) ||
            (cliente.ruta && cliente.ruta.toLowerCase().includes(searchLower)) ||
            (cliente.contacto && cliente.contacto.toLowerCase().includes(searchLower)) ||
            // Include visitador type in search
            (cliente.numeroCliente && isVisitador(cliente.numeroCliente) && 'visitador'.includes(searchLower)) ||
            (cliente.numeroCliente && !isVisitador(cliente.numeroCliente) && 'cliente'.includes(searchLower))
          );
        });
      } else if (filterField === 'tipo') {
        filtered = clientes.filter(cliente => matchesClientType(searchLower, cliente.numeroCliente));
      } else if (filterField === 'numeroCliente') {
        filtered = clientes.filter(cliente => 
          cliente.numeroCliente && cliente.numeroCliente.toLowerCase().includes(searchLower)
        );
      } else {
        filtered = clientes.filter(cliente => {
          const field = cliente[filterField as keyof Cliente];
          return field && typeof field === 'string' && field.toLowerCase().includes(searchLower);
        });
      }
    }
    
    console.log(`After search term filtering: ${filtered.length} clients`);
    
    // Handle showAllTypes toggle
    if (!showAllTypes) {
      filtered = filtered.filter(cliente => !isVisitador(cliente.numeroCliente));
      console.log(`After client type filtering (regular clients only): ${filtered.length} clients`);
    } else {
      console.log(`Showing all client types (${filtered.length} clients)`);
    }
    
    return filtered;
  }, [clientes, searchTerm, filterField, showAllTypes]);

  return filteredClientes;
};
