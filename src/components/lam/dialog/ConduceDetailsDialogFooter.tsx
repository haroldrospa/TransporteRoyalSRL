
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Loader2, X, Save, Printer } from 'lucide-react';
import { Conduce } from '@/types/conduces';
import { printConduce } from '@/utils/printConduce';

interface ConduceDetailsDialogFooterProps {
  editMode: boolean;
  isSubmitting: boolean;
  userCanEdit: boolean;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveChanges: () => void;
  conduce?: Conduce;
  imageData?: string;
}

export const ConduceDetailsDialogFooter = ({
  editMode,
  isSubmitting,
  userCanEdit,
  onEditClick,
  onCancelEdit,
  onSaveChanges,
  conduce,
  imageData
}: ConduceDetailsDialogFooterProps) => {
  const handlePrint = () => {
    if (conduce) printConduce(conduce, imageData || conduce.imagen);
  };

  return (
    <DialogFooter className="border-t border-border/50 bg-muted/30 backdrop-blur-sm p-4 rounded-b-xl">
      <div className="flex justify-between items-center w-full gap-2 flex-wrap">
        <div className="flex gap-2">
          {userCanEdit && !editMode && (
            <Button 
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
              onClick={onEditClick}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar Información
            </Button>
          )}
          {!editMode && conduce && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 ml-auto">
          {editMode ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onCancelEdit}
                disabled={isSubmitting}
                className="border-border text-muted-foreground hover:bg-muted/50 transition-all duration-200"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={onSaveChanges}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Guardar Cambios
              </Button>
            </>
          ) : (
            <DialogClose asChild>
              <Button size="sm" variant="secondary" className="shadow-sm hover:shadow-md transition-all duration-200">
                Cerrar
              </Button>
            </DialogClose>
          )}
        </div>
      </div>
    </DialogFooter>
  );
};
