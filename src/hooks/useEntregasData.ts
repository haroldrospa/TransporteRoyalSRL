
import { useState, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Conduce } from '@/types/conduces';

export const useEntregasData = () => {
  const { conduces, regionActual, loading, refreshData } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle data refresh
  const handleRefreshData = useCallback(async () => {
    await refreshData(); // No force parameter
  }, [refreshData]);
  
  // Check if user is admin (nivel >= 4)
  const isAdmin = useMemo(() => {
    return user?.nivel >= 4;
  }, [user?.nivel]);
  
  // Memoize user conduces to avoid unnecessary re-renders
  const userConduces = useMemo(() => {
    if (!Array.isArray(conduces) || conduces.length === 0) {
      console.log('🚫 No hay conduces disponibles');
      return [];
    }
    
    console.log(`👤 Usuario actual: ${user?.nombre} ${user?.apellido}, Camión: ${user?.camion}, Región: ${regionActual}, Admin: ${isAdmin}`);
    console.log(`📦 Total conduces cargados: ${conduces.length}`);
    
    // Filter out conduces from "Almacen" as they are not delivered to pharmacies
    const filteredConduces = conduces.filter(c => c.encomendado !== 'Almacen');
    console.log(`📦 Conduces después de filtrar Almacén: ${filteredConduces.length}`);
    
    // If user is admin, show all conduces in the region (except Almacen)
    if (isAdmin) {
      const adminConduces = filteredConduces.filter(c => c.region === regionActual);
      console.log(`👑 Admin - Conduces en región ${regionActual}: ${adminConduces.length}`);
      return adminConduces;
    }
    
    // If user is not admin, show only their assigned conduces (excluding Almacen)
    if (!user?.camion) {
      console.log('🚫 Usuario sin camión asignado');
      return [];
    }
    
    const userSpecificConduces = filteredConduces.filter(c => 
      c.region === regionActual && 
      c.encomendado === user.camion
    );
    
    console.log(`🚛 Conduces asignados al camión ${user.camion} en región ${regionActual}: ${userSpecificConduces.length}`);
    console.log(`🔍 Verificando si existe conduce 80812552:`, filteredConduces.find(c => c.numeroConduce === '80812552'));
    
    return userSpecificConduces;
  }, [conduces, regionActual, user?.camion, isAdmin]);
  
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
  
  const returnedDeliveries = useMemo(() => 
    userConduces.filter(c => c.estado === 'Devuelto')
  , [userConduces]);

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
    if (!Array.isArray(conduces) || conduces.length === 0) {
      return {};
    }
    
    const stats: Record<string, { conduces: number; bultos: number; clientCount: number; clients: Set<string> }> = {};
    
    // Group all "En tránsito" conduces by truck
    conduces
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
  }, [conduces]);

  return {
    loading,
    regionActual,
    userConduces, // Expose userConduces
    searchTerm,
    setSearchTerm,
    pendingDeliveries,
    completedDeliveries,
    returnedDeliveries,
    handleRefreshData,
    hasCamion: !!user?.camion || isAdmin, // Allow admin access even without truck
    currentCamion: user?.camion,
    stats, // Add the new stats
    truckStats, // Add the truck statistics
    isAdmin // Expose admin status
  };
};
