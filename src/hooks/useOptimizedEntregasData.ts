import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Conduce } from '@/types/conduces';
import { useOptimizedConducesData } from './useOptimizedConducesData';

export const useOptimizedEntregasData = () => {
  const { regionActual, conduces: contextConduces } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usar datos optimizados con límite menor para entregas
  const { 
    conduces: optimizedConduces, 
    loading: optimizedLoading, 
    loadConduceImage,
    refresh: refreshOptimized
  } = useOptimizedConducesData();
  
  // Si no hay datos optimizados, usar datos del contexto como fallback
  const fallbackConduces = optimizedConduces.length === 0 ? (contextConduces || []) : optimizedConduces;
  const effectiveLoading = optimizedLoading && optimizedConduces.length === 0;
  
  // Handle data refresh with better error handling
  const handleRefreshData = useCallback(async () => {
    try {
      await refreshOptimized();
    } catch (error) {
      console.error('Error refreshing optimized data:', error);
      // Fallback: try to refresh context data if optimized fails
      // But don't throw to avoid breaking the UI
    }
  }, [refreshOptimized]);
  
  // Check if user is admin (nivel >= 4)
  const isAdmin = useMemo(() => {
    return user?.nivel >= 4;
  }, [user?.nivel]);
  
  // Memoize user conduces to avoid unnecessary re-renders - optimized for performance
  const userConduces = useMemo(() => {
    const conducesToUse = fallbackConduces;
    
    if (!Array.isArray(conducesToUse) || conducesToUse.length === 0) {
      return [];
    }
    
    // Filter out conduces from "Almacen" as they are not delivered to pharmacies
    const filteredConduces = conducesToUse.filter(c => c.encomendado !== 'Almacen');
    
    // If user is admin, show all conduces in the region (except Almacen)
    if (isAdmin) {
      return filteredConduces.filter(c => c.region === regionActual);
    }
    
    // If user is not admin, show only their assigned conduces (excluding Almacen)
    if (!user?.camion) {
      return [];
    }
    
    return filteredConduces.filter(c => 
      c.region === regionActual && 
      c.encomendado === user.camion
    );
  }, [fallbackConduces, regionActual, user?.camion, isAdmin]);
  
  // Memoize filtered conduces by status with optimized filtering
  const pendingDeliveries = useMemo(() => 
    userConduces.filter(c => c.estado === 'En tránsito')
  , [userConduces]);
  
  const completedDeliveries = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    return userConduces.filter(c => {
      if (c.estado !== 'Entregado') return false;
      
      // Check if delivered today using horaEntregaExacta
      if (c.horaEntregaExacta) {
        const deliveryDate = new Date(c.horaEntregaExacta);
        const deliveryDateStr = deliveryDate.toISOString().split('T')[0];
        return deliveryDateStr === todayStr;
      }
      
      return false;
    });
  }, [userConduces]);
  
  const returnedDeliveries = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    return userConduces.filter(c => {
      if (c.estado !== 'Devuelto') return false;
      
      // Check if returned today using horaEntregaExacta
      if (c.horaEntregaExacta) {
        const returnDate = new Date(c.horaEntregaExacta);
        const returnDateStr = returnDate.toISOString().split('T')[0];
        return returnDateStr === todayStr;
      }
      
      return false;
    });
  }, [userConduces]);

  // Calculate statistics based only on pending deliveries (En tránsito)
  const stats = useMemo(() => {
    const totalBultos = pendingDeliveries.reduce((acc, conduce) => acc + conduce.cantidadBultos, 0);
    const uniqueClients = new Set(pendingDeliveries.map(conduce => conduce.numeroCliente));
    
    return {
      totalClientes: uniqueClients.size,
      totalBultos,
      totalConduces: pendingDeliveries.length
    };
  }, [pendingDeliveries]);

  // Calculate truck statistics for the state overview
  const truckStats = useMemo(() => {
    if (!Array.isArray(fallbackConduces) || fallbackConduces.length === 0) {
      return {};
    }
    
    const stats: Record<string, { conduces: number; bultos: number; clientCount: number; clients: Set<string> }> = {};
    
    // Group all "En tránsito" conduces by truck
    fallbackConduces
      .filter(c => c.estado === 'En tránsito' && c.encomendado)
      .forEach(conduce => {
        if (!conduce.encomendado) return;
        
        if (!stats[conduce.encomendado]) {
          stats[conduce.encomendado] = { 
            conduces: 0, 
            bultos: 0, 
            clientCount: 0,
            clients: new Set() 
          };
        }
        
        stats[conduce.encomendado].conduces++;
        stats[conduce.encomendado].bultos += conduce.cantidadBultos;
        
        if (conduce.numeroCliente) {
          stats[conduce.encomendado].clients.add(conduce.numeroCliente);
        }
      });
    
    // Convert client sets to counts
    const formattedStats = Object.entries(stats).reduce((acc, [truck, data]) => {
      acc[truck] = {
        conduces: data.conduces,
        bultos: data.bultos,
        clientCount: data.clients.size
      };
      return acc;
    }, {} as Record<string, { conduces: number; bultos: number; clientCount: number }>);
    
    return formattedStats;
  }, [fallbackConduces]);

  return {
    loading: effectiveLoading,
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
    loadConduceImage // Exponer función para cargar imágenes bajo demanda
  };
};