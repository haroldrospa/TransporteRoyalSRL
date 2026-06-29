
import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import { useScanner } from '@/hooks/use-scanner';
import ScanTypeSelector from './ScanTypeSelector';
import ScanInput from './ScanInput';
import RelacionSelector from './RelacionSelector';

interface ScanningStationProps {
  conduces: Conduce[];
  scannedConduces: Record<string, string[]>;
  scannedBultos: Record<string, number>;
  scannedBultoIds: Record<string, string[]>;
  onScanConduce: (encomendado: string, conduceNumber: string) => void;
  onScanBulto: (encomendado: string, bultoId: string, conduceNumber: string) => void;
  onNotFound: (scanValue: string, scanType: 'conduce' | 'bulto') => void;
  onUpdateScanValue: (value: string, type: 'conduce' | 'bulto') => void;
  isProcessing: boolean;
  selectedRelacion: string;
  onRelacionChange: (relacion: string) => void;
}

const ScanningStation = ({
  conduces,
  scannedConduces,
  scannedBultos,
  scannedBultoIds,
  onScanConduce,
  onScanBulto,
  onNotFound,
  onUpdateScanValue,
  isProcessing,
  selectedRelacion,
  onRelacionChange
}: ScanningStationProps) => {
  const {
    scanValue,
    setScanValue,
    scanType,
    setScanType,
    handleScan,
    inputRef,
    scanResult
  } = useScanner({
    conduces,
    scannedConduces,
    scannedBultos,
    scannedBultoIds,
    onScanConduce,
    onScanBulto,
    onNotFound,
    onUpdateScanValue,
    isProcessing,
    selectedRelacion
  });

  return (
    <div className="space-y-4 p-4 px-0">
      <h1 className="text-2xl font-bold mb-6 mx-[15px]">Escanear Conduces y Bultos</h1>
      
      <ScanTypeSelector scanType={scanType} onScanTypeChange={setScanType} />
      
      {scanType === 'conduce' && (
        <div className="mx-[15px]">
          <RelacionSelector
            selectedRelacion={selectedRelacion}
            onRelacionChange={onRelacionChange}
            disabled={isProcessing}
          />
        </div>
      )}
      
      <ScanInput 
        value={scanValue} 
        onChange={setScanValue} 
        onScan={handleScan} 
        scanType={scanType} 
        inputRef={inputRef} 
        isProcessing={isProcessing}
        scanResult={scanResult}
      />
    </div>
  );
};

export default ScanningStation;
