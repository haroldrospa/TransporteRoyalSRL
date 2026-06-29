import { Table, TableBody } from '@/components/ui/table';
import { Cliente } from '@/types/cliente';
import { ClienteFormSchema } from '@/components/ClienteForm';
import { useClienteTable } from './hooks/useClienteTable';
import ClienteTableHeader from './ClienteTableHeader';
import ClienteTableRow from './ClienteTableRow';
import EmptyClienteTableRow from './EmptyClienteTableRow';
import ClienteTableLoading from './ClienteTableLoading';
import ClienteTableEmpty from './ClienteTableEmpty';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from '@/components/ui/pagination';

interface OptimizedClientesTableProps {
  clientes: Cliente[];
  loading: boolean;
  onUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
  // Server-side pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

const OptimizedClientesTable = ({
  clientes,
  loading,
  onUpdateCliente,
  onDeleteCliente,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange
}: OptimizedClientesTableProps) => {
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

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      if (startPage > 2) {
        pageNumbers.push(-1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push(-2);
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  if (loading && clientes.length === 0) {
    return <ClienteTableLoading />;
  }

  if (!loading && clientes.length === 0 && totalPages === 0) {
    return <ClienteTableEmpty />;
  }

  return (
    <div className="border rounded-md overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <Table>
          <ClienteTableHeader />
          <TableBody>
            {clientes.length > 0 ? (
              clientes.map((cliente) => (
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
        <div className="py-4 px-2 border-t bg-gray-50">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => hasPrevPage && onPageChange(currentPage - 1)}
                  className={!hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {getPageNumbers().map((pageNum, index) => (
                <PaginationItem key={index}>
                  {pageNum === -1 || pageNum === -2 ? (
                    <span className="px-4 py-2">...</span>
                  ) : (
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => onPageChange(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => hasNextPage && onPageChange(currentPage + 1)} 
                  className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default OptimizedClientesTable;
