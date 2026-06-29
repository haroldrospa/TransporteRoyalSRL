
import { isValid } from 'date-fns';

/**
 * Safely parses a date string in the format DD/MM/YYYY HH:mm or YYYY-MM-DD HH:mm
 */
export const safelyParseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  try {
    // Trim any whitespace
    const trimmedDateStr = dateStr.trim();
    
    // Handle ISO format dates (YYYY-MM-DD)
    if (trimmedDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(trimmedDateStr);
      return isValid(date) ? date : null;
    }
    
    // Split the date and time parts
    const parts = trimmedDateStr.split(' ');
    if (!parts.length) return null;
    
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '00:00';
    
    if (!datePart) return null;
    
    // Check if we're dealing with YYYY-MM-DD format or DD/MM/YYYY format
    let year: number, month: number, day: number;
    
    if (datePart.includes('-')) {
      // YYYY-MM-DD format
      const dateParts = datePart.split('-');
      if (dateParts.length !== 3) return null;
      
      year = parseInt(dateParts[0], 10);
      month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed in JavaScript
      day = parseInt(dateParts[2], 10);
    } else if (datePart.includes('/')) {
      // DD/MM/YYYY format or DD/MM/YY format
      const dateParts = datePart.split('/');
      if (dateParts.length !== 3) return null;
      
      day = parseInt(dateParts[0], 10);
      month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed in JavaScript
      year = parseInt(dateParts[2], 10);
      
      // If the year is provided as a 2-digit number, convert it to 4-digit
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
    } else {
      return null; // Unsupported date format
    }
    
    // Additional validation of parsed values
    if (isNaN(year) || year < 1000 || year > 9999 ||
        isNaN(month) || month < 0 || month > 11 || 
        isNaN(day) || day < 1 || day > 31) {
      return null;
    }
    
    // Parse time part
    let hours = 0, minutes = 0;
    if (timePart && timePart.includes(':')) {
      const timeParts = timePart.split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
      
      // Validate time parts
      if (isNaN(hours) || isNaN(minutes) || 
          hours < 0 || hours > 23 || 
          minutes < 0 || minutes > 59) {
        hours = 0;
        minutes = 0;
      }
    }
    
    // Create the date object with the parsed parts
    const date = new Date(year, month, day, hours, minutes);
    
    // Final validation
    if (isNaN(date.getTime())) {
      console.error(`Invalid date created from string: ${dateStr}`, { year, month, day, hours, minutes });
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date string:', error, dateStr);
    return null;
  }
};
