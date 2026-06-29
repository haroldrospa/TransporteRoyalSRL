
import { Users } from 'lucide-react';

const ClienteTableEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Users className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No hay clientes registrados</h3>
      <p className="text-muted-foreground mb-4">
        No se encontraron clientes en el sistema. Puede importar datos de muestra para comenzar.
      </p>
    </div>
  );
};

export default ClienteTableEmpty;
