
import { useMemo } from 'react';
import { Conduce } from '@/types/conduces';

export const useClienteBultosStats = (conduces: Conduce[]) => {
  const clienteBultosStats = useMemo(() => {
    const stats: Record<string, { totalBultos: number; totalConduces: number }> = {};
    
    conduces.forEach(conduce => {
      const cliente = conduce.numeroCliente;
      if (!cliente) return;
      
      if (!stats[cliente]) {
        stats[cliente] = { totalBultos: 0, totalConduces: 0 };
      }
      
      stats[cliente].totalBultos += conduce.cantidadBultos;
      stats[cliente].totalConduces += 1;
    });
    
    return stats;
  }, [conduces]);

  return clienteBultosStats;
};
