import { User } from '@/contexts/AuthContext';

/**
 * Verifica si el usuario actual es administrador
 * @param user - Usuario actual del contexto de autenticación
 * @returns true si el usuario es administrador
 */
export const isAdministrator = (user: User | null): boolean => {
  if (!user) return false;
  return user.puesto === 'Administrador' || user.nivel >= 5;
};

/**
 * Verifica si el usuario tiene nivel suficiente para una operación
 * @param user - Usuario actual
 * @param requiredLevel - Nivel mínimo requerido
 * @returns true si el usuario tiene el nivel suficiente
 */
export const hasMinimumLevel = (user: User | null, requiredLevel: number): boolean => {
  if (!user) return false;
  return user.nivel >= requiredLevel;
};

/**
 * Verifica si el usuario puede eliminar registros (solo administradores)
 * @param user - Usuario actual
 * @returns true si el usuario puede eliminar registros
 */
export const canDeleteRecords = (user: User | null): boolean => {
  return isAdministrator(user);
};