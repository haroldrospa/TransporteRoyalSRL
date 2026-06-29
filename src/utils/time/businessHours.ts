
import { isValid } from 'date-fns';
import { safelyParseDate } from './dateParser';

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17; // 5:00 PM
const BUSINESS_HOURS_PER_DAY = 9;

/**
 * Checks if a given date is within business hours
 */
export const isBusinessHour = (date: Date): boolean => {
  if (!date || !isValid(date)) return false;
  const hour = date.getHours();
  return hour >= BUSINESS_START_HOUR && hour < BUSINESS_END_HOUR;
};

/**
 * Calculates business hours between two date strings
 */
export const calculateBusinessHours = (startDateStr: string, endDateStr: string): number => {
  try {
    // Safely parse the date strings
    const startDate = safelyParseDate(startDateStr);
    const endDate = safelyParseDate(endDateStr);
    
    // Check if dates are valid
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
      console.error('Invalid date(s) for business hours calculation:', { startDateStr, endDateStr });
      return 0;
    }

    let totalBusinessHours = 0;
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // For each day between start and end date
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      // For first day, only count remaining hours
      if (i === 0) {
        let startHour = currentDate.getHours();
        if (startHour < BUSINESS_START_HOUR) startHour = BUSINESS_START_HOUR;
        const endHour = Math.min(BUSINESS_END_HOUR, 24);
        if (startHour < BUSINESS_END_HOUR) {
          totalBusinessHours += endHour - startHour;
        }
      }
      // For last day, only count hours until current time
      else if (i === totalDays) {
        let endHour = endDate.getHours();
        if (endHour > BUSINESS_END_HOUR) endHour = BUSINESS_END_HOUR;
        if (endHour > BUSINESS_START_HOUR) {
          totalBusinessHours += endHour - BUSINESS_START_HOUR;
        }
      }
      // For full days in between, add full business day hours
      else {
        totalBusinessHours += BUSINESS_HOURS_PER_DAY;
      }
    }
    
    return totalBusinessHours;
  } catch (error) {
    console.error('Error calculating business hours:', error);
    return 0;
  }
};
