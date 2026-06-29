import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import ClientesHeader from '@/components/clientes/ClientesHeader';
import OptimizedClientesContent from '@/components/clientes/OptimizedClientesContent';
import { usePaginatedClientesData } from '@/hooks/usePaginatedClientesData';

const Clientes = () => {
  const {
    clientes,
    totalCount,
    loading,
    isSearching,
    searchTerm,
    setSearchTerm,
    filterField,
    setFilterField,
    showAllTypes,
    setShowAllTypes,
    totalClientsInDatabase,
    clientesSinUbicacion,
    clientesSinRnc,
    isForceRefreshing,
    handleRefreshData,
    forceRefreshData,
    handleAddCliente,
    handleUpdateCliente,
    handleDeleteCliente,
    // Pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onPageChange
  } = usePaginatedClientesData();

  return (
    <Layout>
      <div className="animate-fade-in space-y-4">
        <Card>
         <ClientesHeader 
            onAddCliente={handleAddCliente}
            onRefreshData={handleRefreshData}
            loading={loading}
            onForceRefresh={forceRefreshData}
            isForceRefreshing={isForceRefreshing}
            clientes={clientes}
          />
          
          <OptimizedClientesContent
            clientes={clientes}
            totalCount={totalCount}
            loading={loading}
            isSearching={isSearching}
            onRefreshData={handleRefreshData}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterField={filterField}
            onFilterFieldChange={setFilterField}
            showAllTypes={showAllTypes}
            onShowAllTypesChange={setShowAllTypes}
            onUpdateCliente={handleUpdateCliente}
            onDeleteCliente={handleDeleteCliente}
            totalClientsInDatabase={totalClientsInDatabase}
            clientesSinUbicacion={clientesSinUbicacion}
            clientesSinRnc={clientesSinRnc}
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={onPageChange}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default Clientes;
