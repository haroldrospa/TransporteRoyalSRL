
import { Conduce } from '@/types/conduces';
import { format, parse, isValid } from 'date-fns';
import { safelyParseDate } from '../timeUtils';

export const getUniqueDates = (conduces: Conduce[]) => {
  if (!Array.isArray(conduces) || conduces.length === 0) {
    return [];
  }

  const fechasSinHora: string[] = [];

  conduces.forEach(c => {
    if (!c) return;

    if (c.fechaCarga) {
      try {
        const cargaDate = safelyParseDate(c.fechaCarga);
        if (cargaDate && isValid(cargaDate)) {
          const year = cargaDate.getFullYear();
          if (year >= 2020 && year <= 2030) {
            fechasSinHora.push(format(cargaDate, 'dd/MM/yy'));
          }
        }
      } catch (e) {
        console.error('Error parsing fechaCarga in getUniqueDates:', e, c.fechaCarga);
      }
    }

    if (c.fechaEntrega) {
      try {
        const entregaDate = safelyParseDate(c.fechaEntrega);
        if (entregaDate && isValid(entregaDate)) {
          const year = entregaDate.getFullYear();
          if (year >= 2020 && year <= 2030) {
            fechasSinHora.push(format(entregaDate, 'dd/MM/yy'));
          }
        }
      } catch (e) {
        console.error('Error parsing fechaEntrega in getUniqueDates:', e, c.fechaEntrega);
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
