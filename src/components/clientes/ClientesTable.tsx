
import { Table, TableBody } from '@/components/ui/table';
import { Cliente } from '@/types/cliente';
import { ClienteFormSchema } from '@/components/ClienteForm';
import { useClienteTable } from './hooks/useClienteTable';
import ClienteTableHeader from './ClienteTableHeader';
import ClienteTableRow from './ClienteTableRow';
import EmptyClienteTableRow from './EmptyClienteTableRow';
import ClienteTableLoading from './ClienteTableLoading';
import ClienteTableEmpty from './ClienteTableEmpty';
import { useState } from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from '@/components/ui/pagination';

interface ClientesTableProps {
  clientes: Cliente[];
  filteredClientes: Cliente[];
  loading: boolean;
  onUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
}

const ClientesTable = ({
  clientes,
  filteredClientes,
  loading,
  onUpdateCliente,
  onDeleteCliente
}: ClientesTableProps) => {
  const {
    editingCliente,
    setEditingCliente,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isSubmitting,
    openMaps,
    handleUpdateCliente,
    handleDeleteCliente
  } = useClienteTable({ onUpdateCliente, onDeleteCliente });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / itemsPerPage));
  
  // Get current page's data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClientes = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  
  console.log(`ClientesTable: Showing page ${currentPage}/${totalPages} (${currentClientes.length} items), from ${filteredClientes.length} filtered clients out of ${clientes.length} total`);

  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  };

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push(-1); // -1 represents ellipsis
      }
      
      // Add pages in range
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(-2); // -2 represents ellipsis
      }
      
      // Always include last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  if (loading) {
    return <ClienteTableLoading />;
  }

  if (clientes.length === 0) {
    return <ClienteTableEmpty />;
  }

  return (
    <div className="border rounded-md overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <Table>
          <ClienteTableHeader />
          <TableBody>
            {currentClientes.length > 0 ? (
              currentClientes.map((cliente) => (
                <ClienteTableRow
                  key={cliente.id}
                  cliente={cliente}
                  editingCliente={editingCliente}
                  isEditDialogOpen={isEditDialogOpen}
                  isSubmitting={isSubmitting}
                  setEditingCliente={setEditingCliente}
                  setIsEditDialogOpen={setIsEditDialogOpen}
                  handleUpdateCliente={handleUpdateCliente}
                  handleDeleteCliente={handleDeleteCliente}
                  openMaps={openMaps}
                />
              ))
            ) : (
              <EmptyClienteTableRow />
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {getPageNumbers().map((pageNum, index) => (
                <PaginationItem key={index}>
                  {pageNum === -1 || pageNum === -2 ? (
                    <span className="px-4 py-2">...</span>
                  ) : (
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} 
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ClientesTable;
