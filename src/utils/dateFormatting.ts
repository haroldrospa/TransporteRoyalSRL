
import { format, isValid } from 'date-fns';
import { DateRange } from 'react-day-picker';

export const formatDateRange = (dateRange: DateRange | undefined): string => {
  try {
    if (!dateRange?.from || !isValid(dateRange.from)) {
      return 'Seleccionar fecha';
    }
  
    let formattedFrom = '';
    try {
      formattedFrom = format(dateRange.from, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting from date:', error, dateRange.from);
      return 'Seleccionar fecha';
    }
    
    if (!dateRange.to || !isValid(dateRange.to)) {
      return formattedFrom;
    }
    
    let formattedTo = '';
    try {
      formattedTo = format(dateRange.to, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting to date:', error, dateRange.to);
      return formattedFrom;
    }
    
    return `${formattedFrom} - ${formattedTo}`;
  } catch (error) {
    console.error('Error in formatDateRange:', error);
    return 'Seleccionar fecha';
  }
};
