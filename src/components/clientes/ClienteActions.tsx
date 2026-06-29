
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash } from 'lucide-react';
import { Cliente } from '@/types/cliente';
import ClienteForm, { ClienteFormSchema } from '@/components/ClienteForm';
import { isVisitador } from './utils/clienteTypeUtils';

interface ClienteActionsProps {
  cliente: Cliente;
  editingCliente: string | null;
  isEditDialogOpen: boolean;
  isSubmitting: boolean;
  setEditingCliente: (id: string | null) => void;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  handleUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  handleDeleteCliente: (id: string) => Promise<void>;
}

const ClienteActions = ({
  cliente,
  editingCliente,
  isEditDialogOpen,
  isSubmitting,
  setEditingCliente,
  setIsEditDialogOpen,
  handleUpdateCliente,
  handleDeleteCliente
}: ClienteActionsProps) => {
  return (
    <div className="flex justify-end items-center gap-1">
      <Dialog 
        open={isEditDialogOpen && editingCliente === cliente.id} 
        onOpenChange={(open) => {
          if (!open) setEditingCliente(null);
          setIsEditDialogOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setEditingCliente(cliente.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {isVisitador(cliente.numeroCliente) ? 'Editar Visitador' : 'Editar Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ClienteForm 
            cliente={cliente}
            onSubmit={(updatedCliente) => handleUpdateCliente(cliente.id, updatedCliente)}
            onCancel={() => {
              setEditingCliente(null);
              setIsEditDialogOpen(false);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleDeleteCliente(cliente.id)}
        disabled={isSubmitting}
      >
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
};

export default ClienteActions;
