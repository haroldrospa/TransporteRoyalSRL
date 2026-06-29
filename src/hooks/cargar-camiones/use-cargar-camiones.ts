
import { useVerifiedShipments } from '@/hooks/shipment-verification/use-verified-shipments';
import { useScanValue } from './use-scan-value';
import { useDataRefresh } from './use-data-refresh';
import { useScanHandlers } from './use-scan-handlers';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export function useCargarCamiones() {
  const { user } = useAuth();
  const { conduces, refreshData } = useData();
  
  // Initial setup with a placeholder that returns Promise<void> instead of void
  const initialDataRefresh = useDataRefresh({
    refreshData,
    loadVerifiedShipments: async () => Promise.resolve() // Fixed: Returns Promise<void>
  });
  
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
  } = useVerifiedShipments();

  // Now that we have loadVerifiedShipments, let's update the useDataRefresh call
  const dataRefresh = useDataRefresh({
    refreshData,
    loadVerifiedShipments
  });
  
  // Use the updated values
  const { isRefreshing: isRefreshingData, handleRefreshData: handleRefreshDataUpdated } = dataRefresh;
  
  const {
    currentScanValue,
    setCurrentScanValue,
    currentScanType,
    setCurrentScanType,
    handleUpdateScanValue
  } = useScanValue();
  
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
    currentUser: user
  });
  
  return {
    conduces,
    currentScanValue,
    setCurrentScanValue,
    currentScanType,
    setCurrentScanType,
    isRefreshing: isRefreshingData,
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
    handleRefreshData: handleRefreshDataUpdated
  };
}
