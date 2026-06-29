
import { differenceInHours, isValid } from 'date-fns';
import { safelyParseDate } from './dateParser';

/**
 * Calculates total regular hours between two date strings
 */
export const calculateRegularHours = (startDateStr: string, endDateStr: string): number => {
  try {
    // Safely parse the date strings
    const startDate = safelyParseDate(startDateStr);
    const endDate = safelyParseDate(endDateStr);
    
    // Check if dates are valid
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
      console.error('Invalid date(s) for regular hours calculation:', { startDateStr, endDateStr });
      return 0;
    }

    // Calculate total hours between dates
    const totalHours = differenceInHours(endDate, startDate);
    return totalHours > 0 ? totalHours : 0;  // Ensure we don't return negative hours
  } catch (error) {
    console.error('Error calculating regular hours:', error);
    return 0;
  }
};
