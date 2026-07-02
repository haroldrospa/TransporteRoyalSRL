
import { TableCell, TableRow } from '@/components/ui/table';
import { Cliente } from '@/types/cliente';
import { ClienteFormSchema } from '@/components/ClienteForm';
import { ClienteTypeBadge, ClienteUbicacionButton } from './ClienteBadges';
import ClienteActions from './ClienteActions';
import { isVisitador } from './utils/clienteTypeUtils';
import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';

interface ClienteTableRowProps {
  cliente: Cliente;
  editingCliente: string | null;
  isEditDialogOpen: boolean;
  isSubmitting: boolean;
  setEditingCliente: (id: string | null) => void;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  handleUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  handleDeleteCliente: (id: string) => Promise<void>;
  openMaps: (ubicacion?: string) => void;
}

const ClienteTableRow = ({
  cliente,
  editingCliente,
  isEditDialogOpen,
  isSubmitting,
  setEditingCliente,
  setIsEditDialogOpen,
  handleUpdateCliente,
  handleDeleteCliente,
  openMaps
}: ClienteTableRowProps) => {
  const isClienteVisitador = isVisitador(cliente.numeroCliente);
  
  // Apply different background colors based on client type
  const getRowClass = () => {
    if (isClienteVisitador) return 'bg-blue-50';
    if (cliente.numeroCliente.startsWith('5')) return 'bg-green-50';
    if (cliente.numeroCliente.startsWith('7')) return 'bg-amber-50';
    return '';
  };
  
  return (
    <TableRow className={getRowClass()}>
      <TableCell className="font-medium">{cliente.rnc || "—"}</TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-1">
          {cliente.numeroCliente}
          {cliente.grupo_cliente && (
            <Link2 className="h-3 w-3 text-purple-500" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <ClienteTypeBadge numeroCliente={cliente.numeroCliente} />
      </TableCell>
      <TableCell>{cliente.razonSocial}</TableCell>
      <TableCell>{cliente.ciudad}</TableCell>
      <TableCell>{cliente.zona}</TableCell>
      <TableCell>{cliente.encomendado || "—"}</TableCell>
      <TableCell>{cliente.ruta || "—"}</TableCell>
      <TableCell>{cliente.contacto || "—"}</TableCell>
      <TableCell className="text-sm text-slate-600">{cliente.direccion || "—"}</TableCell>
      <TableCell>
        <ClienteUbicacionButton ubicacion={cliente.ubicacion} openMaps={openMaps} />
      </TableCell>
      <TableCell className="text-right">
        <ClienteActions
          cliente={cliente}
          editingCliente={editingCliente}
          isEditDialogOpen={isEditDialogOpen}
          isSubmitting={isSubmitting}
          setEditingCliente={setEditingCliente}
          setIsEditDialogOpen={setIsEditDialogOpen}
          handleUpdateCliente={handleUpdateCliente}
          handleDeleteCliente={handleDeleteCliente}
        />
      </TableCell>
    </TableRow>
  );
};

export default ClienteTableRow;
