
import { Textarea } from '@/components/ui/textarea';

interface DeliveryNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const DeliveryNoteField = ({ value, onChange }: DeliveryNoteFieldProps) => {
  return (
    <div className="w-full">
      <Textarea
        id="nota"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Observaciones sobre la entrega..."
      />
    </div>
  );
};
