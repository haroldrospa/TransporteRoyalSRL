
import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import { useScanConduce } from './handlers/use-scan-conduce';
import { useScanBulto } from './handlers/use-scan-bulto';
import { type CurrentUser } from './utils/user-info-utils';

interface UseScanHandlersProps {
  conduces: Conduce[];
  refreshData: () => Promise<void>;
  loadVerifiedShipments: () => Promise<void>;
  setScannedConduces: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setScannedBultos: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setScannedBultoIds: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  scannedBultoIds: Record<string, string[]>;
  currentUser?: CurrentUser | null;
  selectedRelacion?: string;
}

export function useScanHandlers({
  conduces,
  refreshData,
  loadVerifiedShipments,
  setScannedConduces,
  setScannedBultos,
  setScannedBultoIds,
  scannedBultoIds,
  currentUser,
  selectedRelacion
}: UseScanHandlersProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Use the separate scan hooks
  const { handleScanConduce } = useScanConduce({
    conduces,
    loadVerifiedShipments,
    setScannedConduces,
    currentUser,
    setIsProcessing,
    isProcessing,
    selectedRelacion
  });

  const { handleScanBulto } = useScanBulto({
    conduces,
    loadVerifiedShipments,
    setScannedBultos,
    setScannedBultoIds,
    currentUser,
    setIsProcessing,
    isProcessing
  });

  return {
    handleScanConduce,
    handleScanBulto,
    isProcessing
  };
}
