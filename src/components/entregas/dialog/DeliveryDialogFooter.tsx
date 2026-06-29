
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, UploadCloud } from 'lucide-react';

interface DeliveryDialogFooterProps {
  isSubmitting: boolean;
  isFormValid: boolean;
  backgroundUpload: boolean;
  onSubmit: () => void;
  onBackgroundSubmit: () => void;
}

export const DeliveryDialogFooter = ({
  isSubmitting,
  isFormValid,
  backgroundUpload,
  onSubmit,
  onBackgroundSubmit
}: DeliveryDialogFooterProps) => {
  return (
    <DialogFooter className="gap-3 pt-4 border-t border-border/50">
      <DialogClose asChild disabled={isSubmitting && !backgroundUpload}>
        <Button 
          variant="ghost" 
          disabled={isSubmitting && !backgroundUpload}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </Button>
      </DialogClose>
      

      
      <Button 
        onClick={onSubmit}
        className={`gap-2 shadow-lg transition-all font-bold ${
          isFormValid 
            ? 'bg-royal-blue hover:bg-[#112d5e] text-white shadow-royal-blue/25' 
            : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
        }`}
        disabled={isSubmitting || !isFormValid}
      >
        {isSubmitting && !backgroundUpload ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-royal-gold" />
            Entregando...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-royal-yellow" />
            Confirmar Entrega
          </>
        )}
      </Button>
    </DialogFooter>
  );
};
