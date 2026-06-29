
import { useState, useMemo } from 'react';
import { Conduce } from '@/types/conduces';

export function useConduceFilters(conduces: Conduce[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [truckFilter, setTruckFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');

  const filteredConduces = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return conduces.filter(c => 
      (searchTerm === '' || 
        (filterField === 'all' && (
          c.numeroConduce?.toLowerCase().includes(term) ||
          c.numeroFactura?.toLowerCase().includes(term) ||
          c.numeroCliente?.toLowerCase().includes(term) ||
          c.razonSocial?.toLowerCase().includes(term) ||
          c.ciudad?.toLowerCase().includes(term) ||
          (c.encomendado?.toLowerCase().includes(term) || (!c.encomendado && term === 'sin asignar'))
        )) ||
        (filterField === 'numeroConduce' && c.numeroConduce?.toLowerCase().includes(term)) ||
        (filterField === 'numeroFactura' && c.numeroFactura?.toLowerCase().includes(term)) ||
        (filterField === 'numeroCliente' && c.numeroCliente?.toLowerCase().includes(term)) ||
        (filterField === 'razonSocial' && c.razonSocial?.toLowerCase().includes(term)) ||
        (filterField === 'ciudad' && c.ciudad?.toLowerCase().includes(term)) ||
        (filterField === 'encomendado' && 
          (c.encomendado?.toLowerCase().includes(term) || 
           (!c.encomendado && term === 'sin asignar')))
      ) && 
      (routeFilter === 'all' || c.ruta === routeFilter) &&
      (truckFilter === 'all' || c.encomendado === truckFilter) &&
      (labFilter === 'all' || c.laboratorio === labFilter)
    );
  }, [conduces, searchTerm, filterField, routeFilter, truckFilter, labFilter]);

  const uniqueRoutes = useMemo(() => {
    return Array.from(new Set(conduces.filter(c => c.ruta).map(c => c.ruta)));
  }, [conduces]);

  const uniqueTrucks = useMemo(() => {
    // Get trucks from conduces and ensure Almacén is always included
    const trucksFromConduces = conduces.filter(c => c.encomendado).map(c => c.encomendado!);
    const allTrucks = Array.from(new Set([...trucksFromConduces, 'Almacén']));
    
    // Sort trucks: first R-## trucks in numerical order, then other trucks, then Almacén
    return allTrucks.sort((a, b) => {
      // Check if both are R-## format
      const aMatch = a.match(/^R-(\d+)$/);
      const bMatch = b.match(/^R-(\d+)$/);
      
      if (aMatch && bMatch) {
        // Both are R-## format, sort numerically
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      
      if (aMatch && !bMatch) {
        // a is R-##, b is not - a comes first unless b is Almacén
        return b === 'Almacén' ? -1 : -1;
      }
      
      if (!aMatch && bMatch) {
        // b is R-##, a is not - b comes first unless a is Almacén
        return a === 'Almacén' ? 1 : 1;
      }
      
      // Neither are R-## format
      if (a === 'Almacén' && b !== 'Almacén') return 1; // Almacén goes last
      if (b === 'Almacén' && a !== 'Almacén') return -1; // Almacén goes last
      
      // Regular alphabetical sort for other cases
      return a.localeCompare(b);
    });
  }, [conduces]);

  const uniqueLabs = useMemo(() => {
    return Array.from(new Set(conduces.filter(c => c.laboratorio).map(c => c.laboratorio)));
  }, [conduces]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterField('all');
    setRouteFilter('all');
    setTruckFilter('all');
    setLabFilter('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    filterField,
    setFilterField,
    routeFilter,
    setRouteFilter,
    truckFilter,
    setTruckFilter,
    labFilter,
    setLabFilter,
    filteredConduces,
    uniqueRoutes,
    uniqueTrucks,
    uniqueLabs,
    clearFilters
  };
}
