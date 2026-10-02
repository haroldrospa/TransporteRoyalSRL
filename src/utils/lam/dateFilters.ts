
import { Conduce } from '@/types/conduces';
import { isWithinInterval, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { safelyParseDate } from '../timeUtils';

/**
 * Filter conduces by the selected month
 */
export const filterConducesByMonth = (conduces: Conduce[], selectedMonth: Date): Conduce[] => {
  if (!Array.isArray(conduces) || conduces.length === 0 || !selectedMonth || !isValid(selectedMonth)) {
    return [];
  }

  try {
    return conduces.filter(c => {
      if (!c?.fechaCarga) return false;
      const cargaDate = safelyParseDate(c.fechaCarga);
      if (!cargaDate || !isValid(cargaDate)) return false;
      
      // Get the start and end of month
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      
      // Check if start and end dates are valid
      if (!isValid(startDate) || !isValid(endDate)) {
        console.error('Invalid month interval:', startDate, endDate);
        return false;
      }
      
      return isWithinInterval(cargaDate, { start: startDate, end: endDate });
    });
  } catch (error) {
    console.error('Error filtering by month:', error);
    return [];
  }
};
