
import { supabase } from '@/integrations/supabase/client';
import { Usuario, UsuarioFormData } from '@/types/usuarios';
import { toast } from '@/hooks/use-toast';

/**
 * Fetches all users from the database
 */
export async function fetchUsers(): Promise<Usuario[]> {
  try {
    // Use the get_all_users function to avoid recursion with RLS
    const { data, error } = await supabase
      .rpc('get_all_users')
      .returns<Usuario[]>();
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error loading users:', error);
    toast({
      title: 'Error',
      description: 'Could not load users',
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Checks if an email exists for a user other than the specified ID
 */
export async function checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
  try {
    // Use the get_all_users function to avoid recursion
    let query = supabase
      .rpc('get_all_users')
      .eq('email', email);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
}

/**
 * Adds a new user to the database
 */
export async function createUser(newUser: UsuarioFormData): Promise<Usuario | null> {
  try {
    // Check if email exists
    const emailExists = await checkEmailExists(newUser.email);
    if (emailExists) {
      toast({
        title: 'Error',
        description: 'Email is already in use by another user',
        variant: 'destructive',
      });
      return null;
    }
    
    // Use direct insert with the RLS policy we created
    const { data, error } = await supabase
      .from('usuarios')
      .insert(newUser)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Error adding user');
    }
    
    return data as Usuario;
  } catch (error) {
    console.error('Error adding user:', error);
    toast({
      title: 'Error',
      description: 'No se pudo añadir el usuario',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Updates an existing user in the database
 */
export async function updateUser(id: string, updatedUser: UsuarioFormData): Promise<Usuario | null> {
  try {
    // If password is empty, remove it to avoid overwriting the existing one
    const userToUpdate = { ...updatedUser };
    if (!userToUpdate.password) {
      delete userToUpdate.password;
    }
    
    // Check if email is already in use by another user
    if (userToUpdate.email) {
      const emailExists = await checkEmailExists(userToUpdate.email, id);
      if (emailExists) {
        toast({
          title: 'Error',
          description: 'Email is already in use by another user',
          variant: 'destructive',
        });
        return null;
      }
    }
    
    // Use direct update with our RLS policies
    const { data, error } = await supabase
      .from('usuarios')
      .update(userToUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as Usuario;
  } catch (error) {
    console.error('Error updating user:', error);
    toast({
      title: 'Error',
      description: 'No se pudo actualizar el usuario',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Deletes a user from the database
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    toast({
      title: 'Error',
      description: 'No se pudo eliminar el usuario',
      variant: 'destructive',
    });
    return false;
  }
}
