
import { Button } from '@/components/ui/button';
import { Package, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ScanTypeSelectorProps {
  scanType: 'conduce' | 'bulto';
  onScanTypeChange: (type: 'conduce' | 'bulto') => void;
}

const ScanTypeSelector = ({ scanType, onScanTypeChange }: ScanTypeSelectorProps) => {
  const { user } = useAuth();
  const isEscaneadorConduces = user?.puesto === 'Escaneador de conduces' || user?.puesto === 'Despachador';
  const isEscaneadorBultos = user?.puesto === 'Escaneador de bultos';

  return (
    <div className="flex gap-2 mb-4">
      <Button 
        variant={scanType === 'conduce' ? 'default' : 'outline'} 
        className={`flex-1 ${scanType === 'conduce' ? 'bg-royal-blue' : ''} ${isEscaneadorBultos ? 'opacity-50 cursor-not-allowed' : ''}`} 
        onClick={() => !isEscaneadorBultos && onScanTypeChange('conduce')}
        disabled={isEscaneadorBultos}
        title={isEscaneadorBultos ? 'Solo disponible para escaneo de bultos' : undefined}
      >
        <Truck className="h-5 w-5 mr-2" />
        Escanear Conduce
      </Button>
      <Button 
        variant={scanType === 'bulto' ? 'default' : 'outline'} 
        className={`flex-1 ${scanType === 'bulto' ? 'bg-[#0A1D3F] text-white' : ''} ${isEscaneadorConduces ? 'opacity-50 cursor-not-allowed' : ''}`} 
        onClick={() => !isEscaneadorConduces && onScanTypeChange('bulto')}
        disabled={isEscaneadorConduces}
        title={isEscaneadorConduces ? 'Solo disponible para escaneo de conduces' : undefined}
      >
        <Package className="h-5 w-5 mr-2" />
        Escanear Bulto
      </Button>
    </div>
  );
};

export default ScanTypeSelector;
