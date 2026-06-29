
import { useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface ClienteGroup {
  numeroCliente: string;
  allNumeroClientes: string[];
  razonSocial: string;
  ciudad: string;
  totalConduces: number;
  totalBultos: number;
  conduces: any[];
  ruta?: string;
}

interface GroupCheckboxProps {
  group: ClienteGroup;
  isGroupSelected: (group: ClienteGroup) => boolean;
  isGroupPartiallySelected: (group: ClienteGroup) => boolean;
  onToggleGroupSelection: (group: ClienteGroup) => void;
}

const GroupCheckbox = ({ 
  group, 
  isGroupSelected, 
  isGroupPartiallySelected, 
  onToggleGroupSelection 
}: GroupCheckboxProps) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      const input = checkboxRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (input) {
        input.indeterminate = isGroupPartiallySelected(group) && !isGroupSelected(group);
      }
    }
  }, [group, isGroupPartiallySelected, isGroupSelected]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef as any}
      checked={isGroupSelected(group)}
      onChange={() => onToggleGroupSelection(group)}
      className="h-4 w-4 shrink-0 md:h-4 md:w-4 z-10 cursor-pointer"
    />
  );
};

export default GroupCheckbox;
