
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
      (labFilter === 'all' || 
        (labFilter === 'Krishpar Care Dominicana' || labFilter === 'Krishpar care dominicana'
          ? (c.laboratorio === 'Krishpar Care Dominicana' || c.laboratorio === 'Krishpar care dominicana')
          : c.laboratorio === labFilter))
    );
  }, [conduces, searchTerm, filterField, routeFilter, truckFilter, labFilter]);

  const uniqueRoutes = useMemo(() => {
    return Array.from(new Set(conduces.filter(c => c.ruta).map(c => c.ruta)));
  }, [conduces]);

  const uniqueTrucks = useMemo(() => {
    // Get trucks from conduces and ensure Almacen is always included
    const trucksFromConduces = conduces.filter(c => c.encomendado).map(c => c.encomendado!);
    const allTrucks = Array.from(new Set([...trucksFromConduces, 'Almacen']));
    
    return allTrucks.sort((a, b) => {
      const aIsWh = a.toLowerCase().includes('almacen');
      const bIsWh = b.toLowerCase().includes('almacen');
      if (!aIsWh && bIsWh) return -1;
      if (aIsWh && !bIsWh) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [conduces]);

  const uniqueLabs = useMemo(() => {
    const defaultLabs = ['LAM', 'Fersuaz', 'Taapharmaceutica', 'Innovacion Quimica', 'Krishpar Care Dominicana'];
    const currentLabs = conduces.filter(c => c.laboratorio).map(c => c.laboratorio);
    return Array.from(new Set([...defaultLabs, ...currentLabs]));
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
