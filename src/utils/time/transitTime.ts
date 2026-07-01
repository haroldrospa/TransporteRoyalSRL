
import { differenceInHours, differenceInMinutes, addDays, getDay, isWeekend, format } from 'date-fns';
import { safelyParseDate } from './dateParser';
import { isVisitador } from '@/components/clientes/utils/clienteTypeUtils';

export interface TransitTimeInfo {
  hours: number;
  minutes: number;
  totalHours: number;
  status: 'normal' | 'warning' | 'expired';
  displayText: string;
}

// Cache local para días festivos - se actualiza cuando se cargan desde la base de datos
let cachedDiasFestivos: Set<string> = new Set();

/**
 * Actualiza el cache local de días festivos (llamada desde el componente DiasFestivos)
 */
export const updateDiasFestivosCache = (diasFestivos: { fecha: string }[]) => {
  cachedDiasFestivos = new Set(diasFestivos.map(dia => dia.fecha));
};

/**
 * Verifica si una fecha es día festivo (versión síncrona usando cache)
 */
const esDiaFestivoSync = (fecha: string): boolean => {
  return cachedDiasFestivos.has(fecha);
};

/**
 * Calcula el tiempo transcurrido en días laborables desde que un conduce está en tránsito
 * Cuenta 24 horas completas de lunes a viernes, pausa durante fines de semana
 */
export const calculateTransitTime = (fechaEntrega: string, numeroCliente?: string): TransitTimeInfo => {
  const now = new Date();
  const entregaDate = safelyParseDate(fechaEntrega);
  const esVisitador = isVisitador(numeroCliente || '');
  const expiredThreshold = esVisitador ? 72 : 36;
  const warningThreshold = esVisitador ? 48 : 24;
  
  if (!entregaDate) {
    return {
      hours: 0,
      minutes: 0,
      totalHours: 0,
      status: 'normal',
      displayText: '0h 0m'
    };
  }

  // Obtener el próximo día laboral válido desde la fecha de entrega
  const startTime = getNextBusinessStart(entregaDate);
  
  // Si el tiempo actual es antes del tiempo de inicio, mostrar tiempo restante
  if (now <= startTime) {
    const minutesUntilStart = differenceInMinutes(startTime, now);
    const hoursUntilStart = Math.floor(minutesUntilStart / 60);
    const remainingMinutes = minutesUntilStart % 60;
    
    return {
      hours: hoursUntilStart,
      minutes: remainingMinutes,
      totalHours: hoursUntilStart + (remainingMinutes / 60),
      status: 'normal',
      displayText: `Inicia en ${hoursUntilStart}h ${remainingMinutes}m`
    };
  }

  const businessMinutes = calculateBusinessMinutes(startTime, now);
  const totalHours = Math.floor(businessMinutes / 60);
  const remainingMinutes = businessMinutes % 60;

    let status: 'normal' | 'warning' | 'expired' = 'normal';
  if (totalHours > expiredThreshold) {
    status = 'expired';
  } else if (totalHours >= warningThreshold) {
    status = 'warning';
  }

  return {
    hours: totalHours,
    minutes: remainingMinutes,
    totalHours: totalHours + (remainingMinutes / 60),
    status,
    displayText: `${totalHours}h ${remainingMinutes}m`
  };
};

/**
 * Obtiene el próximo horario de inicio de negocio válido desde una fecha dada
 * Pausa desde viernes 11:59 PM hasta lunes 8:00 AM y durante días festivos
 */
const getNextBusinessStart = (date: Date): Date => {
  const result = new Date(date);
  let dayOfWeek = getDay(result); // 0=domingo, 1=lunes, 6=sábado
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  
  // Función para avanzar al siguiente día laboral no festivo
  const findNextBusinessDay = (startDate: Date): Date => {
    const tempDate = new Date(startDate);
    
    while (true) {
      const tempDayOfWeek = getDay(tempDate);
      const fechaStr = format(tempDate, 'yyyy-MM-dd');
      
      // Si es día laborable (lunes a viernes) y no es festivo
      if (tempDayOfWeek >= 1 && tempDayOfWeek <= 5 && !esDiaFestivoSync(fechaStr)) {
        return tempDate;
      }
      
      // Avanzar al siguiente día
      tempDate.setDate(tempDate.getDate() + 1);
    }
  };
  
  // Si es viernes después de 11:59 PM, buscar el próximo día laboral
  if (dayOfWeek === 5 && (currentHour > 23 || (currentHour === 23 && currentMinute >= 59))) {
    const nextBusinessDay = findNextBusinessDay(new Date(result.getTime() + 24 * 60 * 60 * 1000)); // día siguiente
    nextBusinessDay.setHours(8, 0, 0, 0);
    return nextBusinessDay;
  }
  
  // Si es fin de semana, buscar el próximo día laboral
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const nextBusinessDay = findNextBusinessDay(new Date(result.getTime() + 24 * 60 * 60 * 1000)); // día siguiente
    nextBusinessDay.setHours(8, 0, 0, 0);
    return nextBusinessDay;
  }
  
  // Si es día festivo, buscar el próximo día laboral
  const fechaActual = format(result, 'yyyy-MM-dd');
  if (esDiaFestivoSync(fechaActual)) {
    const nextBusinessDay = findNextBusinessDay(new Date(result.getTime() + 24 * 60 * 60 * 1000)); // día siguiente
    nextBusinessDay.setHours(8, 0, 0, 0);
    return nextBusinessDay;
  }
  
  // Para días laborables no festivos, SIEMPRE iniciar a las 8:00 AM del día de entrega
  result.setHours(8, 0, 0, 0);
  
  return result;
};

/**
 * Calcula los minutos laborables entre dos fechas
 * Pausa desde viernes 11:59 PM hasta lunes 8:00 AM y durante días festivos
 */
const calculateBusinessMinutes = (startDate: Date, endDate: Date): number => {
  let totalMinutes = 0;
  const current = new Date(startDate);
  
  while (current < endDate) {
    const dayOfWeek = getDay(current);
    const currentHour = current.getHours();
    const fechaActual = format(current, 'yyyy-MM-dd');
    
    // Solo procesar días laborables (lunes=1 a viernes=5) y que no sean festivos
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !esDiaFestivoSync(fechaActual)) {
      let dayStart = new Date(current);
      let dayEnd = new Date(current);
      
      // Para viernes, el día laboral termina a las 11:59 PM
      if (dayOfWeek === 5) {
        dayStart.setHours(0, 0, 0, 0);
        dayEnd.setHours(23, 59, 0, 0); // Viernes termina a las 11:59 PM
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
 * Obtiene las clases CSS para el indicador de tiempo en tránsito
 */
export const getTransitTimeClasses = (status: 'normal' | 'warning' | 'expired'): string => {
  switch (status) {
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};
