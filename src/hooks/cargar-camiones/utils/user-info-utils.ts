
/**
 * Utility functions for handling user information in scan operations
 */

export interface UserInfo {
  user_id: string | null;
  user_name: string | null;
}

export interface CurrentUser {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
}

/**
 * Extract user information for database operations
 */
export function getUserInfo(currentUser?: CurrentUser | null): UserInfo {
  if (!currentUser) return { user_id: null, user_name: null };
  
  const userName = currentUser.nombre && currentUser.apellido 
    ? `${currentUser.nombre} ${currentUser.apellido}`
    : currentUser.email || 'Usuario';
    
  return {
    user_id: currentUser.id,
    user_name: userName
  };
}
