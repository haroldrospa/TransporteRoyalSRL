import { useRef } from 'react';
import ScanInput from '@/components/cargar-camiones/ScanInput';
import { Card, CardContent } from '@/components/ui/card';
import ScanResultInfo from './ScanResultInfo';

interface ScanResult {
  conduceNumber: string;
  fechaCarga?: string;
  relacionNombre?: string;
  error?: boolean;
  errorMessage?: string;
}

interface ControlConducesScanSectionProps {
  scanValue: string;
  setScanValue: (value: string) => void;
  onScan: () => void;
  isProcessing: boolean;
  scanResult: ScanResult | null;
}

const ControlConducesScanSection = ({
  scanValue,
  setScanValue,
  onScan,
  isProcessing,
  scanResult
}: ControlConducesScanSectionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
      onScan();
    }
  };

  return (
    <div className="mx-4 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Escanear Conduce Recibido
            </h3>
            <ScanInput
              value={scanValue}
              onChange={setScanValue}
              onScan={onScan}
              scanType="conduce"
              inputRef={inputRef}
              isProcessing={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {scanResult && (
        <ScanResultInfo
          conduceNumber={scanResult.conduceNumber}
          fechaCarga={scanResult.fechaCarga}
          relacionNombre={scanResult.relacionNombre}
          error={scanResult.error}
          errorMessage={scanResult.errorMessage}
        />
      )}
    </div>
  );
};

export default ControlConducesScanSection;
