
import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Conduce, Region } from '@/types/conduces';
import { isConduceDelayed } from '@/utils/time';
import { getCamionesStatsByRegion } from '@/utils/trucksByRegion';

export function useDashboardData() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { conduces, clientes, regionActual, setRegionActual, loading } = useData();
  
  const filteredConduces = useMemo(() => {
    return conduces.filter(conduce => conduce.region === regionActual);
  }, [conduces, regionActual]);
  
  // Calcular bultos por región con memoización
  const norteBultos = useMemo(() => {
    return conduces
      .filter(conduce => conduce.region === 'Norte' && conduce.estado === 'En tránsito')
      .reduce((acc, conduce) => acc + conduce.cantidadBultos, 0);
  }, [conduces]);
  
  const surBultos = useMemo(() => {
    return conduces
      .filter(conduce => conduce.region === 'Sur' && conduce.estado === 'En tránsito')
      .reduce((acc, conduce) => acc + conduce.cantidadBultos, 0);
  }, [conduces]);
  
  // Calcular entregas retrasadas con memoización
  const delayedCount = useMemo(() => {
    return conduces.filter(conduce => 
      conduce.estado === 'En tránsito' && isConduceDelayed(conduce)
    ).length;
  }, [conduces]);

  // Calcular estadísticas de camiones con memoización
  const camionesStats = useMemo(() => {
    const stats = getCamionesStatsByRegion(regionActual);
    
    // Procesar conductos en tránsito
    conduces
      .filter(conduce => conduce.estado === 'En tránsito' && conduce.encomendado)
      .forEach(conduce => {
        const truck = conduce.encomendado as keyof typeof stats;
        if (stats[truck]) {
          stats[truck].clientCount += 1;
          stats[truck].bultos += conduce.cantidadBultos;
        }
      });
    
    // Convert the stats object to an array format expected by components
    return Object.entries(stats).map(([truck, data]) => ({
      truck,
      clientCount: data.clientCount,
      bultos: data.bultos,
      conduces: data.clientCount // For compatibility, conduces count = client count
    }));
  }, [conduces, regionActual]);
  
  // Efecto para controlar el estado de carga
  useEffect(() => {
    if (!loading && conduces.length > 0) {
      setIsLoading(false);
    }
  }, [loading, conduces]);

  return {
    conduces: filteredConduces,
    norteBultos,
    surBultos,
    delayedCount,
    camionesStats,
    regionActual,
    setRegionActual,
    isLoading
  };
}
