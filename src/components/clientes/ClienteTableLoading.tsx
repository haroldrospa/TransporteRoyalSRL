
import { Loader2 } from 'lucide-react';

const ClienteTableLoading = () => {
  return (
    <div className="flex justify-center items-center h-40">
      <Loader2 className="h-8 w-8 animate-spin text-royal-blue" />
      <span className="ml-2 text-lg">Cargando clientes...</span>
    </div>
  );
};

export default ClienteTableLoading;
