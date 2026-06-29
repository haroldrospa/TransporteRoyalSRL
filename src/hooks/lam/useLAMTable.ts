
import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { Conduce } from '@/types/conduces';
import { filterAndSortConduces } from '@/utils/lam/filterUtils';

export const useLAMTable = (
  regionConduces: Conduce[],
  statsFilteredConduces: Conduce[], // Conduces filtrados por rango de fechas
  selectedDate: string,
  selectedMonth: Date | undefined,
  parseDeliveryTime: (time: string) => number,
  allLabConduces?: Conduce[] // Todos los conduces del laboratorio (sin filtro de región) para búsqueda global
) => {
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [selectedConduce, setSelectedConduce] = useState<Conduce | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('');

  // Debounce search term to improve performance
  const [debouncedSearchTerm] = useDebounce(tableSearchTerm, 300);

  // Filter and sort conduces for the table with debounced search
  const sortedConduces = useMemo(() => {
    // Cuando hay un término de búsqueda, buscar en TODOS los conduces del laboratorio
    // (ignorando el filtro de región) para que el usuario siempre encuentre el conduce
    const conducesToFilter = debouncedSearchTerm && Array.isArray(allLabConduces) && allLabConduces.length > 0
      ? allLabConduces
      : regionConduces;
    
    if (!Array.isArray(conducesToFilter)) return [];
    
    const result = filterAndSortConduces(
      conducesToFilter,
      debouncedSearchTerm,
      selectedDate,
      undefined,
      parseDeliveryTime,
      estadoFilter
    );
    
    return result;
  }, [regionConduces, allLabConduces, debouncedSearchTerm, selectedDate, parseDeliveryTime, estadoFilter]);

  // Memoize click handler
  const handleConduceClick = useCallback((conduce: Conduce) => {
    if (!conduce) return;
    
    if (conduce.estado === 'Entregado' || conduce.estado === 'Devuelto') {
      setSelectedConduce(conduce);
      setShowDetailsDialog(true);
    }
  }, []);

  return {
    tableSearchTerm,
    setTableSearchTerm,
    selectedConduce,
    setSelectedConduce,
    showDetailsDialog,
    setShowDetailsDialog,
    sortedConduces,
    handleConduceClick,
    estadoFilter,
    setEstadoFilter
  };
};
