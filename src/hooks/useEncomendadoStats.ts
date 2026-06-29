
import { useMemo } from 'react';
import { Conduce } from '@/types/conduces';
import { useAuth } from '@/contexts/AuthContext';

export function useEncomendadoStats(
  assignedConduces: Conduce[],
  scannedConduces: Record<string, string[]>,
  scannedBultoIds: Record<string, string[]>
) {
  const { user } = useAuth();
  
  return useMemo(() => {
    const stats: Record<string, { 
      conduces: number, 
      bultos: number, 
      scannedConduces: number, 
      scannedBultos: number,
      clientCount: number,
      priorityConduces: number,
      priorityDetails: Conduce[]
    }> = {};

    // Global scanned sets (do NOT depend on encomendado key; assignments can change)
    const scannedConduceSet = new Set(Object.values(scannedConduces).flat());

    const scannedBultosByConduce: Record<string, number> = {};
    Object.values(scannedBultoIds)
      .flat()
      .forEach((id) => {
        const conduceNumber = id.split('-')[0];
        if (!conduceNumber) return;
        scannedBultosByConduce[conduceNumber] = (scannedBultosByConduce[conduceNumber] || 0) + 1;
      });

    // Procesar todos los conduces asignados
    assignedConduces.forEach(conduce => {
      const encomendado = conduce.encomendado || 'Sin asignar';
      
      if (!stats[encomendado]) {
        stats[encomendado] = { 
          conduces: 0, 
          bultos: 0, 
          scannedConduces: 0, 
          scannedBultos: 0,
          clientCount: 0,
          priorityConduces: 0,
          priorityDetails: []
        };
      }
      
      stats[encomendado].conduces += 1;
      stats[encomendado].bultos += conduce.cantidadBultos;

      if (scannedConduceSet.has(conduce.numeroConduce)) {
        stats[encomendado].scannedConduces += 1;
      }

      const scannedForConduce = scannedBultosByConduce[conduce.numeroConduce] || 0;
      stats[encomendado].scannedBultos += Math.min(scannedForConduce, conduce.cantidadBultos);
      
      // Contar conduces con prioridad
      if (conduce.prioridad) {
        stats[encomendado].priorityConduces += 1;
        stats[encomendado].priorityDetails.push(conduce);
      }
    });

    // Contar clientes únicos por encomendado
    const clientesPorEncomendado = assignedConduces.reduce((acc, conduce) => {
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

    // Filter out "Almacen" for LAM users
    if (user?.puesto === 'LAM') {
      delete stats['Almacen'];
    }

    return stats;
  }, [assignedConduces, scannedConduces, scannedBultoIds, user]);
}
