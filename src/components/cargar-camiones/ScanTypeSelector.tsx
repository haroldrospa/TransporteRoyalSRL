
import { Button } from '@/components/ui/button';
import { Package, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ScanTypeSelectorProps {
  scanType: 'conduce' | 'bulto';
  onScanTypeChange: (type: 'conduce' | 'bulto') => void;
}

const ScanTypeSelector = ({ scanType, onScanTypeChange }: ScanTypeSelectorProps) => {
  const { user } = useAuth();
  const isDespachador = user?.puesto === 'Despachador';

  return (
    <div className="flex gap-2 mb-4">
      <Button 
        variant={scanType === 'conduce' ? 'default' : 'outline'} 
        className={`flex-1 ${scanType === 'conduce' ? 'bg-royal-blue' : ''} ${isDespachador ? 'opacity-50' : ''}`} 
        onClick={() => !isDespachador && onScanTypeChange('conduce')}
        disabled={isDespachador}
      >
        <Truck className="h-5 w-5 mr-2" />
        Escanear Conduce
      </Button>
      <Button 
        variant={scanType === 'bulto' ? 'default' : 'outline'} 
        className={`flex-1 ${scanType === 'bulto' ? 'bg-[#0A1D3F] text-white' : ''}`} 
        onClick={() => onScanTypeChange('bulto')}
      >
        <Package className="h-5 w-5 mr-2" />
        Escanear Bulto
      </Button>
    </div>
  );
};

export default ScanTypeSelector;
