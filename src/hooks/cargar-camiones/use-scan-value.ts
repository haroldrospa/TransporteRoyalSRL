
import { useState } from 'react';

export function useScanValue() {
  const [currentScanValue, setCurrentScanValue] = useState('');
  const [currentScanType, setCurrentScanType] = useState<'conduce' | 'bulto'>('conduce');
  
  const handleUpdateScanValue = (value: string, type: 'conduce' | 'bulto') => {
    setCurrentScanValue(value);
    setCurrentScanType(type);
  };

  return {
    currentScanValue,
    setCurrentScanValue,
    currentScanType,
    setCurrentScanType,
    handleUpdateScanValue
  };
}
