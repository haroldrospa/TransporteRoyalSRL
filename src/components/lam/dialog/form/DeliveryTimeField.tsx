
import { Input } from '@/components/ui/input';

interface DeliveryTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const DeliveryTimeField = ({ value, onChange }: DeliveryTimeFieldProps) => {
  return (
    <div className="w-full">
      <Input
        id="tiempoEntrega"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: 24h 15m"
      />
    </div>
  );
};
