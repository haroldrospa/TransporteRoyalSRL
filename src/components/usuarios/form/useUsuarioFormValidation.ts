
import { useState } from 'react';
import { UsuarioFormData } from '@/types/usuarios';
import { UseFormReturn } from 'react-hook-form';

interface UseUsuarioFormValidationProps {
  form: UseFormReturn<UsuarioFormData>;
  isEditing: boolean;
}

export function useUsuarioFormValidation({ form, isEditing }: UseUsuarioFormValidationProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (data: UsuarioFormData): boolean => {
    // Clear any previous errors
    setFormError(null);
    
    // Additional validation for when editing a user (password can be empty)
    if (!isEditing && !data.password) {
      setFormError('La contraseña es obligatoria para nuevos usuarios');
      return false;
    }
    
    // Extra validation for drivers needing an assigned truck
    if (data.puesto === 'Chofer' && !data.camion) {
      setFormError('Debe seleccionar un camión para choferes');
      return false;
    }

    return true;
  };

  return {
    formError,
    setFormError,
    validateForm
  };
}
