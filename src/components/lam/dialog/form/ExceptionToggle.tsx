
import { Switch } from '@/components/ui/switch';

interface ExceptionToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const ExceptionToggle = ({ checked, onCheckedChange }: ExceptionToggleProps) => {
  return (
    <Switch
      id="excepcion"
      checked={checked}
      onCheckedChange={onCheckedChange}
    />
  );
};
