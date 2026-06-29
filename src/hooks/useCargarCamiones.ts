
import { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from './cargar-camiones/use-data-refresh';
import { useScanHandlers } from './cargar-camiones/use-scan-handlers';
import { useScanValue } from './cargar-camiones/use-scan-value';
import { useVerifiedShipments } from './shipment-verification/use-verified-shipments';
import { useRelaciones } from './cargar-camiones/use-relaciones';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useCargarCamiones = () => {
  const { conduces, refreshData } = useData();
  const { user } = useAuth();
  
  // Debug logging
  console.log('useCargarCamiones - Total conduces received:', conduces.length);
  console.log('useCargarCamiones - Sample conduce:', conduces.length > 0 ? conduces[0] : 'No conduces');
  
  const {
    scannedConduces,
    scannedBultos,
    scannedBultoIds,
    verifiedShipments,
    loadVerifiedShipments,
    clearVerifiedShipments,
    deleteShipment,
    exportToExcel,
    setScannedConduces,
    setScannedBultos,
    setScannedBultoIds
  } = useVerifiedShipments(conduces);

  const { isRefreshing, handleRefreshData } = useDataRefresh({
    refreshData,
    loadVerifiedShipments
  });
  
  const {
    currentScanValue,
    setCurrentScanValue,
    currentScanType,
    setCurrentScanType,
    handleUpdateScanValue
  } = useScanValue();

  const {
    relaciones,
    selectedRelacion,
    setSelectedRelacion
  } = useRelaciones();

  const {
    handleScanConduce,
    handleScanBulto,
    isProcessing
  } = useScanHandlers({
    conduces,
    refreshData,
    loadVerifiedShipments,
    setScannedConduces,
    setScannedBultos,
    setScannedBultoIds,
    scannedBultoIds,
    currentUser: user,
    selectedRelacion
  });

  // Real-time subscriptions for verified_shipments
  useEffect(() => {
    const channel = supabase
      .channel('verified-shipments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'verified_shipments'
        },
        () => {
          // Refresh verified shipments when any change occurs
          loadVerifiedShipments();
          toast({
            title: "Datos actualizados",
            description: "Los envíos verificados han sido actualizados en tiempo real",
            duration: 2000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadVerifiedShipments]);

  // Real-time subscriptions for conduces changes
  useEffect(() => {
    const channel = supabase
      .channel('conduces-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conduces'
        },
        () => {
          // Refresh conduces data when updated
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  return {
    conduces,
    currentScanValue,
    setCurrentScanValue,
    currentScanType,
    setCurrentScanType,
    isRefreshing,
    isProcessing,
    scannedConduces,
    scannedBultos,
    scannedBultoIds,
    verifiedShipments,
    loadVerifiedShipments,
    clearVerifiedShipments,
    deleteShipment,
    exportToExcel,
    handleScanConduce,
    handleScanBulto,
    handleUpdateScanValue,
    handleRefreshData,
    relaciones,
    selectedRelacion,
    setSelectedRelacion
  };
};
