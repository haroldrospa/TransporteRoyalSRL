
import { Cliente } from '@/types/cliente';
import { parseDeliveryTime } from './lamUtils';

export const filterClientes = (
  clientes: Cliente[], 
  searchTerm: string, 
  filterField: string
): Cliente[] => {
  if (!clientes || clientes.length === 0) {
    console.log('No clientes available to filter');
    return [];
  }
  
  if (!searchTerm || searchTerm === '') return clientes;
  
  const searchLower = searchTerm.toLowerCase().trim();
  console.log(`Filtering ${clientes.length} clientes with searchTerm: "${searchLower}" on field: ${filterField}`);
  
  return clientes.filter(cliente => {
    if (!cliente) {
      console.log('Found null or undefined cliente in filter');
      return false;
    }
    
    if (filterField === 'all') {
      return (
        (cliente.numeroCliente && cliente.numeroCliente.toLowerCase().includes(searchLower)) ||
        (cliente.razonSocial && cliente.razonSocial.toLowerCase().includes(searchLower)) ||
        (cliente.ciudad && cliente.ciudad.toLowerCase().includes(searchLower)) ||
        (cliente.encomendado && cliente.encomendado.toLowerCase().includes(searchLower)) ||
        (cliente.ruta && cliente.ruta.toLowerCase().includes(searchLower)) ||
        (cliente.contacto && cliente.contacto.toLowerCase().includes(searchLower)) ||
        (cliente.zona && cliente.zona.toLowerCase().includes(searchLower))
      );
    }
    
    if (filterField === 'numeroCliente') return cliente.numeroCliente?.toLowerCase().includes(searchLower) || false;
    if (filterField === 'razonSocial') return cliente.razonSocial?.toLowerCase().includes(searchLower) || false;
    if (filterField === 'ciudad') return cliente.ciudad?.toLowerCase().includes(searchLower) || false;
    if (filterField === 'encomendado') return cliente.encomendado?.toLowerCase().includes(searchLower) || false;
    if (filterField === 'ruta') return cliente.ruta?.toLowerCase().includes(searchLower) || false;
    if (filterField === 'contacto') return cliente.contacto?.toLowerCase().includes(searchLower) || false;
    if (filterField === 'zona') return cliente.zona?.toLowerCase().includes(searchLower) || false;
    
    return false;
  });
};

export const logClienteDetails = (cliente: Cliente | undefined): void => {
  if (!cliente) {
    console.log('Cliente is null or undefined');
    return;
  }
  
  console.log(`Cliente Details:
    ID: ${cliente.id}
    Número: ${cliente.numeroCliente}
    Razón Social: ${cliente.razonSocial}
    Ciudad: ${cliente.ciudad}
    Zona: ${cliente.zona}
    Encomendado: ${cliente.encomendado || 'N/A'}
    Ruta: ${cliente.ruta || 'N/A'}
    Contacto: ${cliente.contacto || 'N/A'}
    Ubicación: ${cliente.ubicacion || 'N/A'}
  `);
};
