
import { Info } from 'lucide-react';

interface RequiredFormNoticeProps {
  isFormValid: boolean;
  isSubmitting: boolean;
}

export const RequiredFormNotice = ({ isFormValid, isSubmitting }: RequiredFormNoticeProps) => {
  if (isFormValid || isSubmitting) return null;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 animate-fade-in">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 shrink-0">
        <Info className="h-4 w-4 text-amber-600" />
      </div>
      <p className="text-sm">
        La <strong>firma</strong> y la <strong>foto</strong> son obligatorias para completar la entrega.
      </p>
    </div>
  );
};
