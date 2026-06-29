
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export const NoCamionAssigned = () => {
  return (
    <Card className="p-8 text-center">
      <CardTitle className="mb-2">No tienes un camión asignado</CardTitle>
      <CardDescription>
        Para gestionar entregas, necesitas tener un camión asignado a tu usuario.
        Contacta al administrador para solicitar una asignación.
      </CardDescription>
    </Card>
  );
};
