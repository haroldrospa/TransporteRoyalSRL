import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Pencil, Trash, Shield, Search } from 'lucide-react';
import { Usuario } from '@/types/usuarios';
import UsuarioForm from './UsuarioForm';
import { useAuth } from '@/contexts/AuthContext';

interface UsuariosTableProps {
  usuarios: Usuario[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onUpdateUser: (id: string, userData: Omit<Usuario, "id">) => Promise<boolean>;
  onDeleteUser: (id: string) => Promise<boolean>;
}

const UsuariosTable = ({
  usuarios,
  isLoading,
  searchTerm,
  onSearchChange,
  onUpdateUser,
  onDeleteUser
}: UsuariosTableProps) => {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users based on search term
  const filteredUsers = usuarios.filter(usuario => {
    if (searchTerm === '') return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      usuario.nombre.toLowerCase().includes(searchLower) ||
      usuario.apellido.toLowerCase().includes(searchLower) ||
      usuario.email.toLowerCase().includes(searchLower) ||
      usuario.puesto.toLowerCase().includes(searchLower) ||
      (usuario.camion?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Group users by puesto in a specific order
  const puestoOrder = ['Administrador', 'Despachador', 'LAM', 'Laboratorio', 'Chofer'];
  const groupedUsers = puestoOrder.reduce((acc, puesto) => {
    const usersInPuesto = filteredUsers.filter(u => u.puesto === puesto);
    if (usersInPuesto.length > 0) {
      acc[puesto] = usersInPuesto;
    }
    return acc;
  }, {} as Record<string, Usuario[]>);

  const handleEditUser = (id: string) => {
    setEditingUser(id);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateUser = async (id: string, userData: Omit<Usuario, "id">) => {
    setIsSubmitting(true);
    try {
      await onUpdateUser(id, userData);
      setEditingUser(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <div className="relative grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Nivel de Acceso</TableHead>
                <TableHead>Camión</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-muted-foreground">Cargando usuarios...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                <>
                  {Object.entries(groupedUsers).map(([puesto, usersInGroup]) => (
                    <>
                      <TableRow key={`header-${puesto}`} className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={6} className="font-semibold text-sm">
                          {puesto} ({usersInGroup.length})
                        </TableCell>
                      </TableRow>
                      {usersInGroup.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.nombre} {usuario.apellido}
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>{usuario.puesto}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Shield className={`h-4 w-4 mr-1 ${
                                usuario.nivel >= 4 ? 'text-green-500' : 
                                usuario.nivel >= 3 ? 'text-blue-500' :
                                usuario.nivel >= 2 ? 'text-yellow-500' : 'text-gray-500'
                              }`} />
                              Nivel {usuario.nivel}
                            </div>
                          </TableCell>
                          <TableCell>
                            {usuario.camion || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              <Dialog 
                                open={isEditDialogOpen && editingUser === usuario.id} 
                                onOpenChange={(open) => {
                                  if (!open) setEditingUser(null);
                                  setIsEditDialogOpen(open);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEditUser(usuario.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[550px]">
                                  <DialogHeader>
                                    <DialogTitle>Editar Usuario</DialogTitle>
                                  </DialogHeader>
                                  <UsuarioForm 
                                    usuario={usuario}
                                    onSubmit={(updatedUser) => {
                                      handleUpdateUser(usuario.id, updatedUser);
                                    }}
                                    onCancel={() => {
                                      setEditingUser(null);
                                      setIsEditDialogOpen(false);
                                    }}
                                    isSubmitting={isSubmitting}
                                  />
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => onDeleteUser(usuario.id)}
                                disabled={usuario.id === user?.id}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No se encontraron usuarios</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default UsuariosTable;
