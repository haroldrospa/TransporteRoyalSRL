
import { User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

interface UsuariosHeaderProps {
  onOpenAddDialog: () => void;
}

const UsuariosHeader = ({ onOpenAddDialog }: UsuariosHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-royal-blue" onClick={onOpenAddDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Usuario
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
};

export default UsuariosHeader;
