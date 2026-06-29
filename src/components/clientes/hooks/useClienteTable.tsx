
import { useState } from 'react';
import { Cliente } from '@/types/cliente';
import { ClienteFormSchema } from '@/components/ClienteForm';
import { toast } from '@/hooks/use-toast';

interface UseClienteTableProps {
  onUpdateCliente: (id: string, cliente: ClienteFormSchema) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
}

export const useClienteTable = ({ onUpdateCliente, onDeleteCliente }: UseClienteTableProps) => {
  const [editingCliente, setEditingCliente] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openMaps = (ubicacion?: string) => {
    if (!ubicacion) {
      toast({
        title: "Error",
        description: "Este cliente no tiene ubicación registrada",
        variant: "destructive"
      });
      return;
    }
    
    window.open(`https://www.google.com/maps/search/?api=1&query=${ubicacion}`, '_blank');
  };

  const handleUpdateCliente = async (id: string, cliente: ClienteFormSchema) => {
    setIsSubmitting(true);
    try {
      await onUpdateCliente(id, cliente);
      setEditingCliente(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente en todas las tablas relacionadas",
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Por favor intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCliente = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este cliente?')) {
      setIsSubmitting(true);
      try {
        await onDeleteCliente(id);
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente",
        });
      } catch (error) {
        console.error('Error deleting client:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    editingCliente,
    setEditingCliente,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isSubmitting,
    openMaps,
    handleUpdateCliente,
    handleDeleteCliente
  };
};
