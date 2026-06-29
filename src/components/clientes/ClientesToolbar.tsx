
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import ClienteForm, { ClienteFormSchema } from '@/components/ClienteForm';
import { toast } from '@/hooks/use-toast';

interface ClientesToolbarProps {
  onAddCliente: (cliente: ClienteFormSchema) => Promise<void>;
  onRefreshData: () => Promise<void>;
  loading: boolean;
}

const ClientesToolbar = ({ onAddCliente, onRefreshData, loading }: ClientesToolbarProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCliente = async (cliente: ClienteFormSchema) => {
    setIsSubmitting(true);
    try {
      await onAddCliente(cliente);
      setIsAddDialogOpen(false);
      toast({
        title: "Cliente agregado",
        description: "El cliente ha sido agregado exitosamente",
      });
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        className="flex items-center gap-1"
        onClick={onRefreshData}
        disabled={loading}
      >
        {loading ? 
          <Loader2 className="h-4 w-4 animate-spin" /> : 
          <Loader2 className="h-4 w-4" />
        }
        Actualizar
      </Button>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-royal-blue">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Cliente
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm 
            onSubmit={handleAddCliente}
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesToolbar;
