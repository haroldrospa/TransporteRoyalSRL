
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { isValid } from 'date-fns';

export const useDateRangeSelector = (dateRange: DateRange | undefined, onDateRangeChange: (range: DateRange | undefined) => void) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMonthSelect = (monthIndex: number) => {
    try {
      console.log('🗓️ Month selector - Month index selected:', monthIndex);
      const now = new Date();
      const year = now.getFullYear();
      
      if (isNaN(year) || year < 1970 || year > 3000) {
        console.error('Invalid year value:', year);
        return;
      }
      
      if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        console.error('Invalid month index:', monthIndex);
        return;
      }
      
      const from = new Date(year, monthIndex, 1, 12, 0, 0);
      const to = new Date(year, monthIndex + 1, 0, 12, 0, 0);
      
      console.log('🗓️ Month selector - Created date range:', { from, to });
      
      if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && isValid(from) && isValid(to)) {
        console.log('🗓️ Month selector - Setting date range:', { from, to });
        onDateRangeChange({ from, to });
      } else {
        console.error('Invalid date range created:', from, to);
      }
    } catch (error) {
      console.error('Error selecting month:', error);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return {
    isExpanded,
    handleMonthSelect,
    toggleExpand
  };
};
