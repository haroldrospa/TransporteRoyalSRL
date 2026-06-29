
import { Conduce } from '@/types/conduces';
import { format, parse, isValid } from 'date-fns';
import { safelyParseDate } from '../timeUtils';

export const getUniqueDates = (conduces: Conduce[]) => {
  if (!Array.isArray(conduces) || conduces.length === 0) {
    return [];
  }

  // Extract only the date part (DD/MM/YY) without the hour
  const fechasSinHora = conduces
    .map(c => {
      if (!c || !c.fechaEntrega) return null;
      
      try {
        const conduceDate = safelyParseDate(c.fechaEntrega);
        if (!conduceDate || !isValid(conduceDate)) return null;
        
        return format(conduceDate, 'dd/MM/yy');
      } catch (error) {
        console.error('Error getting unique dates:', error, c.fechaEntrega);
        return null;
      }
    })
    .filter(Boolean) as string[];
  
  // Sort dates chronologically - ensure all dates are valid before sorting
  return Array.from(new Set(fechasSinHora)).sort((a, b) => {
    try {
      if (!a || !b) return 0;
      
      // Explicitly handle potential parsing errors
      let dateA: Date | null = null;
      let dateB: Date | null = null;
      
      try {
        dateA = parse(a, 'dd/MM/yy', new Date());
        if (!dateA || !isValid(dateA)) return 0;
      } catch (err) {
        console.error('Failed to parse date A:', a, err);
        return 0;
      }
      
      try {
        dateB = parse(b, 'dd/MM/yy', new Date());
        if (!dateB || !isValid(dateB)) return 0;
      } catch (err) {
        console.error('Failed to parse date B:', b, err);
        return 0;
      }
      
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
