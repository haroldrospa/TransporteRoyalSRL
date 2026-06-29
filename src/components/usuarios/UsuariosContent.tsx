
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User } from 'lucide-react';
import { Usuario, UsuarioFormData } from '@/types/usuarios';
import UsuariosTable from './UsuariosTable';
import UsuariosHeader from './UsuariosHeader';
import AddUsuarioDialog from './AddUsuarioDialog';
import { useUsuarios } from '@/hooks/useUsuarios';

const UsuariosContent = () => {
  const {
    users,
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    addUser,
    updateUser,
    deleteUser
  } = useUsuarios();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleOpenAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <UsuariosHeader onOpenAddDialog={handleOpenAddDialog} />
      
      <AddUsuarioDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={addUser}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-1">
            <User className="h-5 w-5 text-royal-blue" />
            System Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsuariosTable 
            usuarios={users}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UsuariosContent;
