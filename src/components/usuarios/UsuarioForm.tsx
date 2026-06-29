
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { UsuarioFormData, Usuario } from '@/types/usuarios';
import { useUsuarioFormValidation } from './form/useUsuarioFormValidation';
import FormHeader from './form/FormHeader';
import FormFieldGroups from './form/FormFieldGroups';
import FormActions from './form/FormActions';

// Define validation schema for the form
const usuarioFormSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es obligatorio'),
  nombre: z.string().min(1, 'Nombre es obligatorio'),
  apellido: z.string().min(1, 'Apellido es obligatorio'),
  password: z.string().refine(
    () => true, // We'll handle custom validation in the submit handler
    {
      message: 'Contraseña es obligatoria para nuevos usuarios',
    }
  ),
  nivel: z.number().min(1).max(6),
  puesto: z.string().min(1, 'Puesto es obligatorio'),
  camion: z.string().optional(),
  laboratorio: z.string().optional(),
});

interface UsuarioFormProps {
  usuario?: Usuario;
  onSubmit: (usuario: UsuarioFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const UsuarioForm = ({ usuario, onSubmit, onCancel, isSubmitting = false }: UsuarioFormProps) => {
  const isEditing = !!usuario;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      email: usuario?.email || '',
      nombre: usuario?.nombre || '',
      apellido: usuario?.apellido || '',
      password: '',
      nivel: usuario?.nivel || 1,
      puesto: usuario?.puesto || 'Chofer',
      camion: usuario?.camion || '',
      laboratorio: usuario?.laboratorio || ''
    },
  });

  const { formError, validateForm } = useUsuarioFormValidation({
    form,
    isEditing
  });

  const handleSubmit = (data: UsuarioFormData) => {
    try {
      if (!validateForm(data)) {
        return;
      }
      
      // Submit form data
      onSubmit(data);
    } catch (error) {
      console.error('Error processing form:', error);
    }
  };

  const selectedPuesto = form.watch('puesto');
  const isChofer = selectedPuesto === 'Chofer';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
        <FormHeader formError={formError} />
        
        <FormFieldGroups 
          control={form.control} 
          isSubmitting={isSubmitting} 
          isChofer={isChofer} 
          isEditing={isEditing} 
        />

        <FormActions 
          onCancel={onCancel} 
          isSubmitting={isSubmitting} 
          isEditing={isEditing} 
        />
      </form>
    </Form>
  );
};

export default UsuarioForm;
