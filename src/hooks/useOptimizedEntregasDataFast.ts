import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Conduce } from '@/types/conduces';
import { useOptimizedConducesData } from './useOptimizedConducesData';
import { calculateTransitTime } from '@/utils/time/transitTime';

// Ultra-optimized version specifically for entregas page
export const useOptimizedEntregasDataFast = () => {
  const { regionActual } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use optimized conduces data
  const { 
    conduces: optimizedConduces, 
    loading: optimizedLoading, 
    loadConduceImage,
    refresh: refreshOptimized
  } = useOptimizedConducesData();
  
  // Handle data refresh with error handling
  const handleRefreshData = useCallback(async () => {
    try {
      await refreshOptimized();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [refreshOptimized]);
  
  // Check if user is admin (nivel >= 4)
  const isAdmin = useMemo(() => user?.nivel >= 4, [user?.nivel]);
  
  // Ultra-optimized user conduces filtering - single pass through data
  const { userConduces, pendingDeliveries, completedDeliveries, returnedDeliveries } = useMemo(() => {
    if (!Array.isArray(optimizedConduces) || optimizedConduces.length === 0) {
      return { userConduces: [], pendingDeliveries: [], completedDeliveries: [], returnedDeliveries: [] };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const userConducesList: Conduce[] = [];
    const pending: Conduce[] = [];
    const completed: Conduce[] = [];
    const returned: Conduce[] = [];
    
    // Single pass filtering for maximum performance
    for (const conduce of optimizedConduces) {
      // Skip Almacen conduces
      if (conduce.encomendado === 'Almacen') continue;
      
      // Check if conduce belongs to user
      let belongsToUser = false;
      if (isAdmin) {
        belongsToUser = conduce.region === regionActual;
      } else if (user?.camion) {
        belongsToUser = conduce.region === regionActual && conduce.encomendado === user.camion;
      }
      
      if (!belongsToUser) continue;
      
      userConducesList.push(conduce);
      
      // Categorize by status in the same loop
      switch (conduce.estado) {
        case 'En tránsito':
          pending.push(conduce);
          break;
        case 'Entregado':
          if (conduce.horaEntregaExacta) {
            const deliveryDate = new Date(conduce.horaEntregaExacta).toISOString().split('T')[0];
            if (deliveryDate === today) {
              completed.push(conduce);
            }
          }
          break;
        case 'Devuelto':
          if (conduce.horaEntregaExacta) {
            const returnDate = new Date(conduce.horaEntregaExacta).toISOString().split('T')[0];
            if (returnDate === today) {
              returned.push(conduce);
            }
          }
          break;
      }
    }
    
    // Sort pending deliveries: priority first, then by transit time (more hours first)
    const sortedPending = pending.sort((a, b) => {
      // First, sort by priority (priority conduces first)
      if (a.prioridad && !b.prioridad) return -1;
      if (!a.prioridad && b.prioridad) return 1;
      
      // If both have same priority status, sort by transit time (more hours first)
      const timeA = calculateTransitTime(a.fechaEntrega).totalHours;
      const timeB = calculateTransitTime(b.fechaEntrega).totalHours;
      return timeB - timeA; // Descending order (more hours first)
    });
    
    return {
      userConduces: userConducesList,
      pendingDeliveries: sortedPending,
      completedDeliveries: completed,
      returnedDeliveries: returned
    };
  }, [optimizedConduces, regionActual, user?.camion, isAdmin]);

  // Calculate statistics in one pass
  const stats = useMemo(() => {
    let totalBultos = 0;
    const uniqueClients = new Set<string>();
    
    for (const conduce of pendingDeliveries) {
      totalBultos += conduce.cantidadBultos;
      if (conduce.numeroCliente) {
        uniqueClients.add(conduce.numeroCliente);
      }
    }
    
    return {
      totalClientes: uniqueClients.size,
      totalBultos,
      totalConduces: pendingDeliveries.length
    };
  }, [pendingDeliveries]);

  // Optimized truck statistics
  const truckStats = useMemo(() => {
    const stats: Record<string, { conduces: number; bultos: number; clientCount: number }> = {};
    const truckClients: Record<string, Set<string>> = {};
    
    // Single pass through all conduces for truck stats
    for (const conduce of optimizedConduces) {
      if (conduce.estado === 'En tránsito' && conduce.encomendado && conduce.encomendado !== 'Almacen') {
        if (!stats[conduce.encomendado]) {
          stats[conduce.encomendado] = { conduces: 0, bultos: 0, clientCount: 0 };
          truckClients[conduce.encomendado] = new Set();
        }
        
        stats[conduce.encomendado].conduces++;
        stats[conduce.encomendado].bultos += conduce.cantidadBultos;
        
        if (conduce.numeroCliente) {
          truckClients[conduce.encomendado].add(conduce.numeroCliente);
        }
      }
    }
    
    // Convert sets to counts
    for (const truck in stats) {
      stats[truck].clientCount = truckClients[truck].size;
    }
    
    return stats;
  }, [optimizedConduces]);

  return {
    loading: optimizedLoading,
    regionActual,
    userConduces,
    searchTerm,
    setSearchTerm,
    pendingDeliveries,
    completedDeliveries,
    returnedDeliveries,
    handleRefreshData,
    hasCamion: !!user?.camion || isAdmin,
    currentCamion: user?.camion,
    stats,
    truckStats,
    isAdmin,
    loadConduceImage
  };
};