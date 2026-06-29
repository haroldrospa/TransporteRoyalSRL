
/**
 * Determines if a client is a "visitador" based on the numeroCliente starting with '6'
 */
export const isVisitador = (numeroCliente: string): boolean => {
  if (!numeroCliente) return false;
  // All client numbers starting with '6' are visitadores, including 601515
  return numeroCliente.startsWith('6');
};

/**
 * Gets the client type category based on first digit
 */
export const getClientType = (numeroCliente: string): string => {
  if (!numeroCliente) return 'Desconocido';
  
  if (numeroCliente.startsWith('6')) return 'Visitador';
  if (numeroCliente.startsWith('10')) return 'Cliente Regular';
  if (numeroCliente.startsWith('5')) return 'Cliente Mayorista';
  if (numeroCliente.startsWith('7')) return 'Cliente Premium';
  
  // Handle any other prefixes - general case for other client types
  return `Cliente ${numeroCliente.charAt(0)}`;
};

/**
 * Determines if a string contains "visitador" or "cliente" terms for filtering
 * This function has been improved to better match search terms
 */
export const matchesClientType = (searchTerm: string, numeroCliente: string): boolean => {
  if (!numeroCliente) return false;
  
  const searchLower = searchTerm.toLowerCase();
  
  // Direct match for specific client number - highest priority
  if (numeroCliente.includes(searchLower)) {
    return true;
  }
  
  // Check for "visitador" related terms
  if ('visitador'.includes(searchLower)) {
    return isVisitador(numeroCliente);
  } 
  
  // Check for "cliente" related terms - this should match any client that is not a visitador
  if ('cliente'.includes(searchLower)) {
    return !isVisitador(numeroCliente);
  }
  
  // For client type numbers (checking first digit)
  const firstDigit = numeroCliente.charAt(0);
  if (searchLower === firstDigit) {
    return true;
  }
  
  // Check if search term matches specific client type categories
  const clientType = getClientType(numeroCliente).toLowerCase();
  return clientType.includes(searchLower);
};
