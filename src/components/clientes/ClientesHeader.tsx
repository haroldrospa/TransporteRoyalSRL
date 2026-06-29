
import { RefreshCw } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClientesToolbar from '@/components/clientes/ClientesToolbar';
import ImportExportButtons from '@/components/clientes/ImportExportButtons';
import MergeClientesDialog from '@/components/clientes/MergeClientesDialog';
import DeleteDuplicatesDialog from '@/components/clientes/DeleteDuplicatesDialog';
import { ClienteFormSchema } from '@/components/ClienteForm';
import { Cliente } from '@/types/cliente';

interface ClientesHeaderProps {
  onAddCliente: (cliente: ClienteFormSchema) => Promise<void>;
  onRefreshData: () => Promise<void>;
  loading: boolean;
  onForceRefresh: () => Promise<void>;
  isForceRefreshing: boolean;
  clientes?: Cliente[];
}

const ClientesHeader = ({
  onAddCliente,
  onRefreshData,
  loading,
  onForceRefresh,
  isForceRefreshing,
  clientes = []
}: ClientesHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-2xl font-bold">Clientes y Visitadores LAM</CardTitle>
      <div className="flex flex-wrap items-center gap-2">
        <MergeClientesDialog clientes={clientes} onMergeComplete={onForceRefresh} />
        <DeleteDuplicatesDialog onComplete={onForceRefresh} />
        <ImportExportButtons onImportComplete={onForceRefresh} />
        <Button
          variant="outline"
          onClick={onForceRefresh}
          disabled={isForceRefreshing || loading}
          className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200"
        >
          <RefreshCw className={`h-4 w-4 ${isForceRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Cargar todos los clientes</span>
        </Button>
        <ClientesToolbar 
          onAddCliente={onAddCliente}
          onRefreshData={onRefreshData}
          loading={loading}
        />
      </div>
    </CardHeader>
  );
};

export default ClientesHeader;
