
import { useVerifiedShipmentsData } from './use-verified-shipments-data';
import { useShipmentDeletion } from './use-shipment-deletion';
import { useExportShipments } from './use-export-shipments';
import { Conduce } from '@/types/conduces';

export function useVerifiedShipments(conduces: Conduce[] = []) {
  const {
    scannedConduces,
    setScannedConduces,
    scannedBultos,
    setScannedBultos,
    scannedBultoIds,
    setScannedBultoIds,
    verifiedShipments,
    setVerifiedShipments,
    loadVerifiedShipments
  } = useVerifiedShipmentsData();

  const { 
    clearVerifiedShipments, 
    clearConducesOnly,
    clearBultosOnly,
    deleteShipment,
    deleteConduceShipment,
    deleteBultoShipment
  } = useShipmentDeletion({
    setScannedConduces,
    setScannedBultos,
    setScannedBultoIds,
    setVerifiedShipments
  });

  const { exportToExcel } = useExportShipments(verifiedShipments, conduces);

  return {
    scannedConduces,
    scannedBultos,
    scannedBultoIds,
    verifiedShipments,
    loadVerifiedShipments,
    clearVerifiedShipments,
    clearConducesOnly,
    clearBultosOnly,
    deleteShipment,
    deleteConduceShipment,
    deleteBultoShipment,
    exportToExcel,
    setScannedConduces,
    setScannedBultos,
    setScannedBultoIds
  };
}
