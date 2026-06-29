
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UsuarioFormData } from '@/types/usuarios';
import UsuarioForm from './UsuarioForm';

interface AddUsuarioDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userData: UsuarioFormData) => Promise<boolean>;
}

const AddUsuarioDialog = ({ isOpen, onOpenChange, onSubmit }: AddUsuarioDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (userData: UsuarioFormData) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(userData);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Ingresa los datos para crear un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>
        <UsuarioForm 
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddUsuarioDialog;
