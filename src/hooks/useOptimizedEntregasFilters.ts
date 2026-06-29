import { useMemo, useCallback } from 'react';
import { Conduce } from '@/types/conduces';

interface UseOptimizedEntregasFiltersProps {
  pendingDeliveries: Conduce[];
  completedDeliveries: Conduce[];
  returnedDeliveries: Conduce[];
  searchTerm: string;
  selectedCity: string;
  selectedLab: string;
}

export const useOptimizedEntregasFilters = ({
  pendingDeliveries,
  completedDeliveries,
  returnedDeliveries,
  searchTerm,
  selectedCity,
  selectedLab
}: UseOptimizedEntregasFiltersProps) => {
  
  // Optimized filter function with minimal operations
  const filterConduces = useCallback((conduces: Conduce[], isPending: boolean = false) => {
    if (!searchTerm && (!selectedCity || !isPending) && !selectedLab) {
      return conduces;
    }

    let filtered = conduces;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conduce => {
        // Cache the lowercase values to avoid repeated conversions
        const numeroConduce = conduce.numeroConduce?.toLowerCase() || '';
        const razonSocial = conduce.razonSocial?.toLowerCase() || '';
        const numeroCliente = conduce.numeroCliente?.toLowerCase() || '';
        const ciudad = conduce.ciudad?.toLowerCase() || '';
        const encomendado = conduce.encomendado?.toLowerCase() || '';
        
        return numeroConduce.includes(term) ||
               razonSocial.includes(term) ||
               numeroCliente.includes(term) ||
               ciudad.includes(term) ||
               encomendado.includes(term);
      });
    }
    
    if (selectedCity && isPending) {
      filtered = filtered.filter(conduce => conduce.ciudad === selectedCity);
    }
    
    if (selectedLab) {
      filtered = filtered.filter(conduce => conduce.laboratorio === selectedLab);
    }
    
    return filtered;
  }, [searchTerm, selectedCity, selectedLab]);

  // Memoize filtered results to prevent unnecessary recalculations
  const filteredResults = useMemo(() => {
    const filteredPending = filterConduces(pendingDeliveries, true);
    const filteredCompleted = filterConduces(completedDeliveries, false);
    const filteredReturned = filterConduces(returnedDeliveries, false);
    
    return {
      filteredPending,
      filteredCompleted,
      filteredReturned,
      totalFilteredResults: filteredPending.length + filteredCompleted.length + filteredReturned.length
    };
  }, [pendingDeliveries, completedDeliveries, returnedDeliveries, filterConduces]);

  // Memoize cities for filter dropdown (only from pending deliveries)
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    pendingDeliveries.forEach(conduce => {
      if (conduce.ciudad) {
        cities.add(conduce.ciudad);
      }
    });
    return Array.from(cities).sort();
  }, [pendingDeliveries]);

  return {
    ...filteredResults,
    availableCities
  };
};