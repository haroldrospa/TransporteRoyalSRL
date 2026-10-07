import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatReadableDate = (dateString: any): string => {
  if (!dateString) return '-';
  
  try {
    if (dateString instanceof Date) {
      return isValid(dateString) ? format(dateString, 'dd/MM/yyyy', { locale: es }) : '-';
    }
    const str = String(dateString).trim();
    if (!str) return '-';

    let date: Date;
    
    // Handle different date formats
    if (str.includes('T')) {
      // ISO format: 2025-08-09T15:56:34.837+00:00
      date = new Date(str);
    } else if (str.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = str.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (str.includes('-')) {
      // YYYY-MM-DD format
      const parts = str.split('-');
      // If it's just YYYY-MM-DD without time
      if (parts.length === 3 && !str.includes('T')) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2].substring(0, 2)));
      } else {
        date = new Date(str);
      }
    } else {
      return str; // Return as is if format is unknown
    }
    
    if (!isValid(date)) {
      return str; // Return original if invalid
    }
    
    // Format: "9 ago 2025" or "09/08/2025"
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return String(dateString); // Return original on error
  }
};

export const formatReadableDateWithTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    let date: Date;
    
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3 && !dateString.includes('T')) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2].substring(0, 2)));
      } else {
        date = new Date(dateString);
      }
    } else {
      return dateString;
    }
    
    if (!isValid(date)) {
      return dateString;
    }
    
    // Format: "09/08/2025 15:56"
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  } catch (error) {
    console.error('Error formatting date with time:', error, dateString);
    return dateString;
  }
};