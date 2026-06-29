
import { useState, useEffect, useCallback } from 'react';
import { Usuario, UsuarioFormData } from '@/types/usuarios';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/services/api/userService';
import { toast } from '@/hooks/use-toast';

export function useUsuarios() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load users from Supabase
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      setError('Could not load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  // Add new user
  const addUser = async (newUser: UsuarioFormData) => {
    const createdUser = await createUser(newUser);
    
    if (createdUser) {
      setUsers([...users, createdUser]);
      toast({
        title: "Usuario añadido",
        description: "El usuario ha sido añadido exitosamente",
      });
      return true;
    }
    return false;
  };
  
  // Update existing user
  const handleUpdateUser = async (id: string, updatedUser: UsuarioFormData) => {
    const updatedUserData = await updateUser(id, updatedUser);
    
    if (updatedUserData) {
      setUsers(users.map(user => 
        user.id === id ? updatedUserData : user
      ));
      
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
      return true;
    }
    return false;
  };
  
  // Delete user
  const handleDeleteUser = async (id: string) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este usuario?')) {
      const success = await deleteUser(id);
      
      if (success) {
        setUsers(users.filter(user => user.id !== id));
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado exitosamente",
        });
        return true;
      }
    }
    return false;
  };

  return {
    users,
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    addUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    loadUsers
  };
}
