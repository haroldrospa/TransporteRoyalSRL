
import { Textarea } from '@/components/ui/textarea';

interface ExceptionNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
}

export const ExceptionNoteField = ({ value, onChange, show }: ExceptionNoteFieldProps) => {
  if (!show) return null;
  
  return (
    <div className="w-full mt-2">
      <Textarea
        id="motivoExcepcion"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describa el motivo de la excepción..."
        className="border-purple-300 focus:border-purple-500"
      />
    </div>
  );
};
