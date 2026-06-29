
import ScanningStation from './ScanningStation';
import ScanResultDisplay from './ScanResultDisplay';
import { Conduce } from '@/types/conduces';

interface CargarCamionesScanningSectionProps {
  conduces: Conduce[];
  scannedConduces: Record<string, string[]>;
  scannedBultos: Record<string, number>;
  scannedBultoIds: Record<string, string[]>;
  onScanConduce: (encomendado: string, conduceNumber: string) => void;
  onScanBulto: (encomendado: string, bultoId: string, conduceNumber: string) => void;
  onNotFound: (scanValue: string, scanType: 'conduce' | 'bulto') => void;
  onUpdateScanValue: (value: string, type: 'conduce' | 'bulto') => void;
  scanValue: string;
  scanType: 'conduce' | 'bulto';
  displayEncomendado?: string;
  displayNotFound?: boolean;
  displayDuplicate?: boolean;
  displayDelivered?: boolean;
  displayUnassigned?: boolean;
  duplicateEncomendado?: string;
  setScanValue: (val: string) => void;
  setScanType: (type: 'conduce' | 'bulto') => void;
  isProcessing: boolean;
  selectedRelacion: string;
  onRelacionChange: (relacion: string) => void;
}

const CargarCamionesScanningSection = ({
  conduces,
  scannedConduces,
  scannedBultos,
  scannedBultoIds,
  onScanConduce,
  onScanBulto,
  onNotFound,
  onUpdateScanValue,
  scanValue,
  scanType,
  displayEncomendado,
  displayNotFound,
  displayDuplicate,
  displayDelivered,
  displayUnassigned,
  duplicateEncomendado,
  setScanValue,
  setScanType,
  isProcessing,
  selectedRelacion,
  onRelacionChange
}: CargarCamionesScanningSectionProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <ScanningStation
        conduces={conduces}
        scannedConduces={scannedConduces}
        scannedBultos={scannedBultos}
        scannedBultoIds={scannedBultoIds}
        onScanConduce={onScanConduce}
        onScanBulto={onScanBulto}
        onNotFound={onNotFound}
        onUpdateScanValue={onUpdateScanValue}
        isProcessing={isProcessing}
        selectedRelacion={selectedRelacion}
        onRelacionChange={onRelacionChange}
      />
      <ScanResultDisplay
        scanValue={scanValue}
        scanType={scanType}
        conduces={conduces}
        scannedBultoIds={scannedBultoIds}
        selectedRelacion={selectedRelacion}
        displayEncomendado={displayEncomendado}
        displayNotFound={displayNotFound}
        displayDuplicate={displayDuplicate}
        displayDelivered={displayDelivered}
        displayUnassigned={displayUnassigned}
        duplicateEncomendado={duplicateEncomendado}
      />
    </div>
  );
};

export default CargarCamionesScanningSection;
