import { useMemo } from 'react';
import { Conduce } from '@/types/conduces';
import { useAuth } from '@/contexts/AuthContext';

export interface TruckDeliveryStats {
  conduces: number;
  bultos: number;
  clientCount: number;
}

export function useTruckDeliveryStats(pendingDeliveries: Conduce[]): Record<string, TruckDeliveryStats> {
  const { user } = useAuth();
  
  return useMemo(() => {
    const stats: Record<string, TruckDeliveryStats> = {};

    // Procesar solo conduces pendientes (En tránsito)
    pendingDeliveries.forEach(conduce => {
      const encomendado = conduce.encomendado || 'Sin asignar';
      
      if (!stats[encomendado]) {
        stats[encomendado] = { 
          conduces: 0, 
          bultos: 0, 
          clientCount: 0
        };
      }
      
      stats[encomendado].conduces += 1;
      stats[encomendado].bultos += conduce.cantidadBultos;
    });

    // Contar clientes únicos por encomendado
    const clientesPorEncomendado = pendingDeliveries.reduce((acc, conduce) => {
      const encomendado = conduce.encomendado || 'Sin asignar';
      if (!acc[encomendado]) {
        acc[encomendado] = new Set();
      }
      acc[encomendado].add(conduce.numeroCliente);
      return acc;
    }, {} as Record<string, Set<string>>);

    Object.keys(stats).forEach(encomendado => {
      stats[encomendado].clientCount = clientesPorEncomendado[encomendado]?.size || 0;
    });

    // Filtrar "Almacen" para usuarios LAM
    if (user?.puesto === 'LAM') {
      delete stats['Almacen'];
    }

    return stats;
  }, [pendingDeliveries, user]);
}
