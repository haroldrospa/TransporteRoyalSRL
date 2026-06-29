
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

const FormActions = ({ onCancel, isSubmitting, isEditing }: FormActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 mt-6">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button 
        type="submit" 
        className="bg-royal-blue" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>{isEditing ? 'Actualizar' : 'Guardar'} Usuario</>
        )}
      </Button>
    </div>
  );
};

export default FormActions;
