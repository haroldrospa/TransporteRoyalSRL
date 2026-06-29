import { useMemo } from 'react';
import { Cliente } from '@/types/cliente';
import { CardContent } from '@/components/ui/card';
import { MapPinOff, Database, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EmptyClientesBanner from '@/components/clientes/EmptyClientesBanner';
import ClientesFilters from '@/components/clientes/ClientesFilters';
import NoDataDisplay from '@/components/clientes/NoDataDisplay';
import { ClienteFormSchema } from '@/components/ClienteForm';
import OptimizedClientesTable from './OptimizedClientesTable';

interface OptimizedClientesContentProps {
  clientes: Cliente[];
  totalCount: number;
  loading: boolean;
  isSearching: boolean;
  onRefreshData: () => Promise<void>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterField: string;
  onFilterFieldChange: (value: string) => void;
  showAllTypes: boolean;
  onShowAllTypesChange: (value: boolean) => void;
  onUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
  totalClientsInDatabase: number;
  clientesSinUbicacion: number;
  clientesSinRnc: number;
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

const OptimizedClientesContent = ({
  clientes,
  totalCount,
  loading,
  isSearching,
  onRefreshData,
  searchTerm,
  onSearchChange,
  filterField,
  onFilterFieldChange,
  showAllTypes,
  onShowAllTypesChange,
  onUpdateCliente,
  onDeleteCliente,
  totalClientsInDatabase,
  clientesSinUbicacion,
  clientesSinRnc,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange
}: OptimizedClientesContentProps) => {

  return (
    <CardContent>
      <EmptyClientesBanner onRefresh={onRefreshData} />
      
      {totalClientsInDatabase > 0 ? (
        <>
          <ClientesFilters 
            searchTerm={searchTerm} 
            onSearchChange={onSearchChange} 
            filterField={filterField} 
            onFilterFieldChange={onFilterFieldChange} 
            showAllTypes={showAllTypes} 
            onShowAllTypesChange={onShowAllTypesChange} 
          />
          
          <div className="mt-4 flex flex-wrap justify-between items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                {searchTerm ? (
                  <>Encontrados {totalCount} de {totalClientsInDatabase} clientes</>
                ) : (
                  <>Mostrando página {currentPage} de {totalPages} ({totalClientsInDatabase} clientes)</>
                )}
              </span>
              {clientesSinUbicacion > 0 && (
                <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-700 flex items-center gap-1">
                  <MapPinOff className="h-3 w-3" />
                  {clientesSinUbicacion} sin ubicación
                </Badge>
              )}
              {clientesSinRnc > 0 && (
                <Badge variant="outline" className="bg-red-100 border-red-300 text-red-700 flex items-center gap-1">
                  <FileX className="h-3 w-3" />
                  {clientesSinRnc} sin RNC
                </Badge>
              )}
            </div>
            {(loading || isSearching) && (
              <span className="text-sm text-blue-600 animate-pulse">
                {isSearching ? 'Buscando...' : 'Actualizando datos...'}
              </span>
            )}
          </div>
          
          <OptimizedClientesTable 
            clientes={clientes}
            loading={loading}
            onUpdateCliente={onUpdateCliente}
            onDeleteCliente={onDeleteCliente}
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <NoDataDisplay />
      )}
    </CardContent>
  );
};

export default OptimizedClientesContent;
