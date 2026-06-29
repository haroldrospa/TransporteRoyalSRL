import { differenceInHours, differenceInMinutes, getDay } from 'date-fns';
import { safelyParseDate } from './dateParser';

/**
 * Calcula el tiempo real de entrega considerando horarios laborables
 * Retorna tiempo negativo si se entregó antes de tiempo, positivo si se entregó tarde
 * Pausa el cálculo desde viernes 6:00 PM hasta lunes 8:00 AM
 */
export const calculateDeliveryTime = (fechaEntregaProgramada: string, fechaEntregaReal: Date = new Date()): string => {
  const fechaProgramada = safelyParseDate(fechaEntregaProgramada);
  
  if (!fechaProgramada) {
    return '0h 0m';
  }

  // Obtener el próximo día laboral válido desde la fecha programada
  const startTime = getNextBusinessStart(fechaProgramada);
  
  // Si la entrega real es antes del tiempo de inicio, se entregó muy temprano
  if (fechaEntregaReal <= startTime) {
    const minutesBeforeStart = differenceInMinutes(startTime, fechaEntregaReal);
    const hours = Math.floor(minutesBeforeStart / 60);
    const minutes = minutesBeforeStart % 60;
    return `-${hours}h ${minutes}m`;
  }

  // Calcular minutos laborables desde el inicio hasta la entrega real
  const businessMinutes = calculateBusinessMinutes(startTime, fechaEntregaReal);
  const hours = Math.floor(businessMinutes / 60);
  const minutes = businessMinutes % 60;
  
  return `${hours}h ${minutes}m`;
};

/**
 * Obtiene el próximo horario de inicio de negocio válido desde una fecha dada
 * Pausa desde viernes 6:00 PM hasta lunes 8:00 AM
 */
const getNextBusinessStart = (date: Date): Date => {
  const result = new Date(date);
  const dayOfWeek = getDay(result); // 0=domingo, 1=lunes, 6=sábado
  const currentHour = date.getHours();
  
  // Si es viernes después de 6 PM, avanzar al próximo lunes 8:00 AM
  if (dayOfWeek === 5 && currentHour >= 18) {
    result.setDate(result.getDate() + 3); // Viernes -> Lunes
    result.setHours(8, 0, 0, 0);
    return result;
  }
  
  // Si es fin de semana (sábado o domingo), avanzar al próximo lunes 8:00 AM
  if (dayOfWeek === 0) { // Domingo
    result.setDate(result.getDate() + 1); // Lunes
    result.setHours(8, 0, 0, 0);
    return result;
  } else if (dayOfWeek === 6) { // Sábado
    result.setDate(result.getDate() + 2); // Lunes
    result.setHours(8, 0, 0, 0);
    return result;
  }
  
  // Para días laborables, mantener la fecha actual pero asegurar que sea después de 8:00 AM
  if (currentHour < 8) {
    result.setHours(8, 0, 0, 0);
  }
  
  return result;
};

/**
 * Calcula los minutos laborables entre dos fechas
 * Pausa desde viernes 6:00 PM hasta lunes 8:00 AM
 */
const calculateBusinessMinutes = (startDate: Date, endDate: Date): number => {
  let totalMinutes = 0;
  const current = new Date(startDate);
  
  while (current < endDate) {
    const dayOfWeek = getDay(current);
    
    // Solo procesar días laborables (lunes=1 a viernes=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      let dayStart = new Date(current);
      let dayEnd = new Date(current);
      
      // Para viernes, el día laboral termina a las 6:00 PM
      if (dayOfWeek === 5) {
        dayStart.setHours(0, 0, 0, 0);
        dayEnd.setHours(18, 0, 0, 0); // Viernes termina a las 6:00 PM
      } else if (dayOfWeek === 1) {
        // Para lunes, el día laboral empieza a las 8:00 AM
        dayStart.setHours(8, 0, 0, 0); // Lunes empieza a las 8:00 AM
        dayEnd.setHours(23, 59, 59, 999);
      } else {
        // Para martes, miércoles y jueves: día completo
        dayStart.setHours(0, 0, 0, 0);
        dayEnd.setHours(23, 59, 59, 999);
      }
      
      // Determinar el inicio y fin efectivo para este día
      const effectiveStart = current > dayStart ? current : dayStart;
      const effectiveEnd = endDate < dayEnd ? endDate : dayEnd;
      
      // Solo contar si hay tiempo válido en este día
      if (effectiveStart < effectiveEnd) {
        totalMinutes += differenceInMinutes(effectiveEnd, effectiveStart);
      }
    }
    
    // Avanzar al siguiente día
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0); // Reiniciar a medianoche
  }
  
  return totalMinutes;
};

/**
 * Determina si una entrega está atrasada basado en el tiempo de entrega
 * No considera atrasadas las entregas con tiempo negativo (entregadas antes de tiempo)
 */
export const isDeliveryDelayed = (tiempoEntrega: string, esVisitador: boolean): boolean => {
  if (!tiempoEntrega) return false;
  
  // Si el tiempo es negativo (entregado antes de tiempo), no está atrasado
  if (tiempoEntrega.startsWith('-')) return false;
  
  // Extraer horas y minutos
  const hoursMatch = tiempoEntrega.match(/(\d+)h/);
  const minutesMatch = tiempoEntrega.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  // Convertir a horas totales
  const totalHours = hours + (minutes / 60);
  
  // Aplicar límites según tipo de cliente
  const delayLimit = esVisitador ? 72 : 36;
  
  return totalHours > delayLimit;
};