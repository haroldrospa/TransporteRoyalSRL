
import { useState, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, isWithinInterval, isValid, format, startOfDay, endOfDay } from 'date-fns';
import { Conduce } from '@/types/conduces';
import { safelyParseDate } from '@/utils/timeUtils';
import { getUniqueDates } from '@/utils/lam/dateUtils';

export const useLAMDates = (conduces: Conduce[]) => {
  // Initialize with current month by default
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    return { from, to };
  });
  
  // Initialize selectedDate empty, will be set to latest load date when data loads
  const [selectedDate, setSelectedDate] = useState('');
  
  // Initialize selectedMonth as undefined - no month filter by default
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get unique dates with proper error handling
  const uniqueDates = useMemo(() => 
    getUniqueDates(conduces)
  , [conduces]);

  // Sync selectedMonth and set selectedDate to a date in the new dateRange when dateRange changes
  useEffect(() => {
    if (dateRange?.from && isValid(dateRange.from)) {
      const monthStart = startOfMonth(dateRange.from);
      console.log('🔄 Syncing selectedMonth with dateRange:', dateRange.from, '-> month:', monthStart);
      setSelectedMonth(monthStart);
      
      setSelectedDate(prevDate => {
        const rangeStart = startOfDay(dateRange.from!);
        const rangeEnd = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        
        // If there is an active day filter, check if it fits the new range
        if (prevDate) {
          const parsedSelectedDate = safelyParseDate(prevDate);
          if (parsedSelectedDate) {
            const inRange = isWithinInterval(parsedSelectedDate, {
              start: rangeStart,
              end: rangeEnd
            });
            if (inRange) return prevDate;
          }
        }
        
        // If not in range or not set, auto-select the latest available day in uniqueDates that falls in the new range
        const datesInRange = uniqueDates.filter(dateStr => {
          const d = safelyParseDate(dateStr);
          return d && isWithinInterval(d, { start: rangeStart, end: rangeEnd });
        });

        if (datesInRange.length > 0) {
          const parsedDates = datesInRange.map(dateStr => ({
            str: dateStr,
            date: safelyParseDate(dateStr)
          })).filter((x): x is { str: string; date: Date } => x.date !== null);
          
          if (parsedDates.length > 0) {
            // Sort descending to get the latest date in the range
            parsedDates.sort((a, b) => b.date.getTime() - a.date.getTime());
            return parsedDates[0].str;
          }
        }
        
        return '';
      });
    } else {
      console.log('🔄 Clearing selectedMonth because dateRange is not set');
      setSelectedMonth(undefined);
      setSelectedDate('');
    }
  }, [dateRange, uniqueDates]);
  
  // Set selectedDate to latest load date when data loads (runs ONLY ONCE upon initial load)
  useEffect(() => {
    if (uniqueDates.length > 0 && !hasInitialized) {
      // Avoid picking a future typo date (e.g. 2034). Allow up to tomorrow.
      const maxAllowed = new Date();
      maxAllowed.setDate(maxAllowed.getDate() + 1);
      maxAllowed.setHours(23, 59, 59, 999);
      
      let initialDate = uniqueDates[0];
      let parsedInitialDate: Date | null = null;
      
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const parsed = safelyParseDate(uniqueDates[i]);
        if (parsed && parsed <= maxAllowed) {
          initialDate = uniqueDates[i];
          parsedInitialDate = parsed;
          break;
        }
      }
      
      console.log('📅 Setting initial selectedDate to latest load date:', initialDate);
      setSelectedDate(initialDate);
      setHasInitialized(true);

      // Sync dateRange to the month of the latest load to prevent mismatch
      // where selectedDate is in June but dateRange is July (resulting in 0 stats)
      if (parsedInitialDate) {
        setDateRange({
          from: startOfMonth(parsedInitialDate),
          to: endOfMonth(parsedInitialDate)
        });
      }
    }
  }, [uniqueDates, hasInitialized]);
  
  const latestLoadDate = useMemo(() => {
    if (uniqueDates.length === 0) return '';
    
    const maxAllowed = new Date();
    maxAllowed.setDate(maxAllowed.getDate() + 1);
    maxAllowed.setHours(23, 59, 59, 999);
    
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const parsed = safelyParseDate(uniqueDates[i]);
      if (parsed && parsed <= maxAllowed) {
        return uniqueDates[i];
      }
    }
    
    return uniqueDates[0];
  }, [uniqueDates]);

  // Function to handle date navigation - navigate through all available dates
  const navigateDate = (direction: 'prev' | 'next') => {
    if (uniqueDates.length === 0) return;

    const currentIndex = uniqueDates.indexOf(selectedDate);
    
    if (direction === 'prev') {
      if (currentIndex === -1) {
        // If current date is not in the list, find the closest previous date
        const today = new Date();
        const closestPrevIndex = uniqueDates.findIndex((dateStr, idx, arr) => {
          if (idx === arr.length - 1) return true; // Last item
          const currentDateParsed = safelyParseDate(dateStr);
          const nextDateParsed = safelyParseDate(arr[idx + 1]);
          if (!currentDateParsed || !nextDateParsed) return false;
          return currentDateParsed <= today && nextDateParsed > today;
        });
        if (closestPrevIndex >= 0) {
          setSelectedDate(uniqueDates[closestPrevIndex]);
        } else if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[uniqueDates.length - 1]);
        }
      } else if (currentIndex > 0) {
        setSelectedDate(uniqueDates[currentIndex - 1]);
      }
    } else if (direction === 'next') {
      if (currentIndex === -1) {
        // If current date is not in the list, find the closest next date
        const today = new Date();
        const closestNextIndex = uniqueDates.findIndex((dateStr) => {
          const dateParsed = safelyParseDate(dateStr);
          if (!dateParsed) return false;
          return dateParsed > today;
        });
        if (closestNextIndex >= 0) {
          setSelectedDate(uniqueDates[closestNextIndex]);
        }
      } else if (currentIndex < uniqueDates.length - 1) {
        setSelectedDate(uniqueDates[currentIndex + 1]);
      }
    }
  };

  // Function to filter conduces by date range
  const filterConducesByDateRange = useMemo(() => {
    return (regionConduces: Conduce[]) => {
      // If no date range is selected, return all conduces
      if (!dateRange?.from) {
        return regionConduces;
      }
      
      const filtered = regionConduces.filter(conduce => {
        try {
          if (!conduce || !conduce.fechaCarga) return false;
          
          const conduceDate = safelyParseDate(conduce.fechaCarga);
          if (!conduceDate || !isValid(conduceDate)) return false;
          
          // If both from and to dates are set, check if within interval
          if (dateRange.to && isValid(dateRange.to)) {
            const rangeStart = startOfDay(dateRange.from);
            const rangeEnd = endOfDay(dateRange.to);
            const inRange = isWithinInterval(conduceDate, { 
              start: rangeStart, 
              end: rangeEnd 
            });
            return inRange;
          }
          
          // If only from date is set, check if on or after that date
          return conduceDate >= startOfDay(dateRange.from);
        } catch (error) {
          console.error('Error filtering conduce by date range:', error);
          return false;
        }
      });
      
      return filtered;
    };
  }, [dateRange]);

  return {
    dateRange,
    setDateRange,
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    uniqueDates,
    latestLoadDate,
    navigateDate,
    filterConducesByDateRange
  };
};
