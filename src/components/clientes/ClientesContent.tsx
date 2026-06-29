import { useMemo } from 'react';
import { Cliente } from '@/types/cliente';
import { CardContent } from '@/components/ui/card';
import { MapPinOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EmptyClientesBanner from '@/components/clientes/EmptyClientesBanner';
import ClientesFilters from '@/components/clientes/ClientesFilters';
import ClientesTable from '@/components/clientes/ClientesTable';
import NoDataDisplay from '@/components/clientes/NoDataDisplay';
import { ClienteFormSchema } from '@/components/ClienteForm';
interface ClientesContentProps {
  clientes: Cliente[];
  filteredClientes: Cliente[];
  loading: boolean;
  emptyClientes: Cliente[];
  onRefreshData: () => Promise<void>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterField: string;
  onFilterFieldChange: (value: string) => void;
  showAllTypes: boolean;
  onShowAllTypesChange: (value: boolean) => void;
  onUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
  totalClientsInDatabase: number | null;
}
const ClientesContent = ({
  clientes,
  filteredClientes,
  loading,
  emptyClientes,
  onRefreshData,
  searchTerm,
  onSearchChange,
  filterField,
  onFilterFieldChange,
  showAllTypes,
  onShowAllTypesChange,
  onUpdateCliente,
  onDeleteCliente,
  totalClientsInDatabase
}: ClientesContentProps) => {
  const clientesSinUbicacion = useMemo(() => {
    return clientes.filter(c => !c.ubicacion || c.ubicacion.trim() === '').length;
  }, [clientes]);

  return <CardContent>
      <EmptyClientesBanner onRefresh={onRefreshData} />
      
      {clientes && clientes.length > 0 ? <>
          <ClientesFilters searchTerm={searchTerm} onSearchChange={onSearchChange} filterField={filterField} onFilterFieldChange={onFilterFieldChange} showAllTypes={showAllTypes} onShowAllTypesChange={onShowAllTypesChange} />
          
          <div className="mt-4 flex flex-wrap justify-between items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-sm">
                Mostrando {filteredClientes.length} de {clientes.length} clientes
              </span>
              {clientesSinUbicacion > 0 && (
                <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-700 flex items-center gap-1">
                  <MapPinOff className="h-3 w-3" />
                  {clientesSinUbicacion} sin ubicación
                </Badge>
              )}
            </div>
            {loading && <span className="text-sm text-blue-600">Actualizando datos...</span>}
          </div>
          
          <ClientesTable clientes={clientes} filteredClientes={filteredClientes} loading={loading} onUpdateCliente={onUpdateCliente} onDeleteCliente={onDeleteCliente} />
        </> : <NoDataDisplay />}
    </CardContent>;
};
export default ClientesContent;