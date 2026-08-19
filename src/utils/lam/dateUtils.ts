
import { Conduce } from '@/types/conduces';
import { format, isValid, addDays } from 'date-fns';
import { safelyParseDate } from '../timeUtils';

export const getUniqueDates = (conduces: Conduce[]) => {
  if (!Array.isArray(conduces) || conduces.length === 0) {
    return [];
  }

  // Max allowed future date: 60 days from today (razonable para entregas futuras)
  const maxAllowed = addDays(new Date(), 60);
  const minAllowed = new Date(2020, 0, 1);

  const fechasSinHora: string[] = [];

  conduces.forEach(c => {
    if (!c) return;

    // Solo indexamos fechaCarga para el calendario y la navegación de fechas.
    // La fechaEntrega se usa solo para filtrado, no para poblar el calendario.
    if (c.fechaCarga) {
      try {
        const cargaDate = safelyParseDate(c.fechaCarga);
        if (cargaDate && isValid(cargaDate) && cargaDate >= minAllowed && cargaDate <= maxAllowed) {
          fechasSinHora.push(format(cargaDate, 'dd/MM/yy'));
        }
      } catch (e) {
        console.error('Error parsing fechaCarga in getUniqueDates:', e, c.fechaCarga);
      }
    }
  });
  
  // Sort dates chronologically - ensure all dates are valid before sorting
  return Array.from(new Set(fechasSinHora)).sort((a, b) => {
    try {
      if (!a || !b) return 0;
      
      let dateA = safelyParseDate(a);
      let dateB = safelyParseDate(b);
      
      if (dateA && dateB && isValid(dateA) && isValid(dateB)) {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    } catch (error) {
      console.error('Error sorting dates:', error, a, b);
      return 0;
    }
  });
};
