
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormHeaderProps {
  formError: string | null;
}

const FormHeader = ({ formError }: FormHeaderProps) => {
  if (!formError) return null;
  
  return (
    <Alert variant="destructive">
      <AlertDescription>{formError}</AlertDescription>
    </Alert>
  );
};

export default FormHeader;
