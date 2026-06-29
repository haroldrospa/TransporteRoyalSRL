import { Conduce } from '@/types/conduces';
import { safelyParseDate } from '../timeUtils';
import { isWithinInterval, startOfMonth, endOfMonth, isValid, format } from 'date-fns';

export const filterConducesBySearch = (conduces: Conduce[], searchTerm: string) => {
  if (!Array.isArray(conduces)) return [];
  if (!searchTerm) return conduces;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Create an indexed object for faster search performance
  const searchableFields = [
    'numeroConduce', 
    'numeroFactura', 
    'numeroCliente', 
    'razonSocial', 
    'ciudad'
  ];
  
  return conduces.filter(conduce => {
    // Fast check for falsy conduce object
    if (!conduce) return false;
    
    // Early return for empty search term
    if (!lowerSearchTerm) return true;
    
    // Direct field search with early returns for better performance
    if (conduce.numeroConduce && conduce.numeroConduce.toLowerCase().includes(lowerSearchTerm)) return true;
    if (conduce.numeroFactura && conduce.numeroFactura.toLowerCase().includes(lowerSearchTerm)) return true;
    if (conduce.numeroCliente && conduce.numeroCliente.toLowerCase().includes(lowerSearchTerm)) return true;
    if (conduce.razonSocial && conduce.razonSocial.toLowerCase().includes(lowerSearchTerm)) return true;
    if (conduce.ciudad && conduce.ciudad.toLowerCase().includes(lowerSearchTerm)) return true;
    
    return false;
  });
};

export const filterAndSortConduces = (
  conduces: Conduce[], 
  searchTerm: string, 
  selectedDate: string,
  selectedMonth: Date | undefined,
  parseDeliveryTime: (time: string) => number,
  estadoFilter?: string
) => {
  // Safety checks for input params
  if (!Array.isArray(conduces)) return [];
  
  // Skip processing if no filtering needed
  if (!searchTerm && !selectedDate && !selectedMonth && !estadoFilter) {
    return [...conduces].sort((a, b) => {
      // Keep "En tránsito" at the top
      if (a.estado === 'En tránsito' && b.estado !== 'En tránsito') return -1;
      if (a.estado !== 'En tránsito' && b.estado === 'En tránsito') return 1;
      
      // Sort by fecha_carga descending (most recent first)
      const dateA = safelyParseDate(a.fechaCarga);
      const dateB = safelyParseDate(b.fechaCarga);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  // Validate selectedMonth first
  const validSelectedMonth = selectedMonth && isValid(selectedMonth) ? selectedMonth : undefined;
  
  // Pre-format search term for better performance
  const lowerSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';
  
  const filteredConduces = conduces.filter(conduce => {
    try {
      // Skip if conduce is invalid
      if (!conduce) return false;
      
      // Filter by estado if specified - handle special filters
      if (estadoFilter) {
        // Map chart names to actual estados
        if (estadoFilter === 'Entregados') {
          if (conduce.estado !== 'Entregado') return false;
        } else if (estadoFilter === 'Devueltos') {
          if (conduce.estado !== 'Devuelto') return false;
        } else if (estadoFilter === 'En tránsito') {
          if (conduce.estado !== 'En tránsito') return false;
        } else if (estadoFilter === 'Atrasados') {
          // Filter for late deliveries without exception
          if (conduce.estado !== 'Entregado') return false;
          if (conduce.excepcion === true) return false;
          
          // Check if delivery was late
          const tiempoEntrega = conduce.tiempoEntrega;
          if (!tiempoEntrega) return false;
          
          const deliveryHours = parseDeliveryTime(tiempoEntrega);
          const isVisitador = conduce.numeroCliente?.startsWith('60');
          const timeLimit = isVisitador ? 60 : 36;
          
          if (deliveryHours <= timeLimit) return false; // Not late
        } else if (estadoFilter === 'Entregado con excepción') {
          // Filter for late deliveries with exception
          if (conduce.estado !== 'Entregado') return false;
          if (conduce.excepcion !== true) return false;
          
          // Check if delivery was late
          const tiempoEntrega = conduce.tiempoEntrega;
          if (!tiempoEntrega) return false;
          
          const deliveryHours = parseDeliveryTime(tiempoEntrega);
          const isVisitador = conduce.numeroCliente?.startsWith('60');
          const timeLimit = isVisitador ? 60 : 36;
          
          if (deliveryHours <= timeLimit) return false; // Not late
        } else {
          // Direct estado match for any other case
          if (conduce.estado !== estadoFilter) return false;
        }
      }
      
      // Enhanced search across all table columns
      const matchesSearch = !lowerSearchTerm || 
        (conduce.numeroConduce && conduce.numeroConduce.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.numeroFactura && conduce.numeroFactura.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.numeroCliente && conduce.numeroCliente.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.razonSocial && conduce.razonSocial.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.ciudad && conduce.ciudad.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.encomendado && conduce.encomendado.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.estado && conduce.estado.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.fechaEntrega && conduce.fechaEntrega.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.fechaCarga && conduce.fechaCarga.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.laboratorio && conduce.laboratorio.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.tiempoEntrega && conduce.tiempoEntrega.toLowerCase().includes(lowerSearchTerm)) ||
        (conduce.cantidadBultos && conduce.cantidadBultos.toString().includes(lowerSearchTerm));
      
      // Skip further checks if search doesn't match
      if (!matchesSearch) return false;
      
      // If there's any search term, skip ALL date filters to show results from all dates
      const skipDateFilters = !!lowerSearchTerm;
      
      // Date filtering logic - check individual date first, then month filter
      const conduceDate = safelyParseDate(conduce.fechaEntrega);
      if (!conduceDate || !isValid(conduceDate)) {
        return false;
      }

      // Skip date filtering if searching with numeric term
      if (skipDateFilters) return true;

      // Individual date filtering (highest priority when specified)
      if (selectedDate) {
        try {
          // Support both dd/MM/yy and dd/MM/yyyy formats for comparison
          const formattedConduce4digit = format(conduceDate, 'dd/MM/yyyy');
          const formattedConduce2digit = format(conduceDate, 'dd/MM/yy');
          const matchesDay = formattedConduce4digit === selectedDate || formattedConduce2digit === selectedDate;
          if (!matchesDay) return false;
        } catch (error) {
          console.error('Error filtering by date:', error, conduce.fechaEntrega);
          return false;
        }
      }

      // Month filtering with safe parsing (only if day filter didn't already filter)
      if (validSelectedMonth) {
        try {
          // Create start and end dates for interval check
          const startDate = startOfMonth(validSelectedMonth);
          const endDate = endOfMonth(validSelectedMonth);
          
          // Ensure both dates are valid
          if (!isValid(startDate) || !isValid(endDate)) {
            console.error('Invalid interval dates:', startDate, endDate);
            return false;
          }
          
          const matchesMonth = isWithinInterval(conduceDate, { 
            start: startDate, 
            end: endDate 
          });
          
          return matchesMonth;
        } catch (error) {
          console.error('Error filtering by month:', error, conduce.fechaEntrega);
          return false;
        }
      }
      
      // If no date filters are active, return true
      return true;
    } catch (error) {
      console.error('Error in filter logic:', error);
      return false;
    }
  });

  // Safety check before sorting
  if (!Array.isArray(filteredConduces)) return [];

  try {
    // Sort by fecha_carga (most recent first), keeping "En tránsito" at the top
    const sortedConduces = [...filteredConduces].sort((a, b) => {
      if (!a || !b) return 0;
      
      // Keep "En tránsito" items at the top
      if (a.estado === 'En tránsito' && b.estado !== 'En tránsito') return -1;
      if (a.estado !== 'En tránsito' && b.estado === 'En tránsito') return 1;
      
      // Sort by fecha_carga descending (most recent first)
      const dateA = safelyParseDate(a.fechaCarga);
      const dateB = safelyParseDate(b.fechaCarga);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.getTime() - dateA.getTime();
    });

    return sortedConduces;
  } catch (error) {
    console.error('Error sorting conduces:', error);
    return filteredConduces;
  }
};
