
import { isVisitador } from '@/components/clientes/utils/clienteTypeUtils';

/**
 * Checks if a conduce is delayed based on its delivery time
 * Considers conduces with negative delivery time as not delayed (delivered early)
 */
export const isConduceDelayed = (conduce: { 
  fechaEntrega: string; 
  numeroCliente: string;
  tiempoEntrega?: string;
}): boolean => {
  if (!conduce || !conduce.tiempoEntrega) return false;
  
  try {
    // Check if the time is negative (delivered early)
    const isNegative = conduce.tiempoEntrega.startsWith('-');
    
    // If time is negative, the conduce was delivered early, so it's not delayed
    if (isNegative) return false;
    
    const hoursMatch = conduce.tiempoEntrega.match(/(\d+)h/);
    const minutesMatch = conduce.tiempoEntrega.match(/(\d+)m/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    
    // Convert to total hours
    const totalHours = hours + (minutes / 60);
    
    const isClienteVisitador = isVisitador(conduce.numeroCliente);
    
    return isClienteVisitador 
      ? totalHours > 72  // 72 horas para visitadores
      : totalHours > 36; // 36 horas para clientes normales
  } catch (error) {
    console.error('Error checking if conduce is delayed:', error);
    return false;
  }
};
