
import { useState, useEffect, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, isWithinInterval, isValid, format, startOfDay, endOfDay } from 'date-fns';
import { Conduce } from '@/types/conduces';
import { safelyParseDate } from '@/utils/timeUtils';
import { getUniqueDates } from '@/utils/lam/dateUtils';

// Helper to normalize any date string to 'dd/MM/yy'
const normalizeToDdMmYy = (dateStr: string): string => {
  if (!dateStr) return '';
  const parsed = safelyParseDate(dateStr);
  if (!parsed || !isValid(parsed)) return dateStr;
  return format(parsed, 'dd/MM/yy');
};

export const useLAMDates = (conduces: Conduce[]) => {
  // Initialize with current month by default
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    return { from, to };
  });
  
  // Initialize selectedDate empty, will be auto-set when uniqueDates is computed
  const [selectedDate, setSelectedDate] = useState('');
  
  // Initialize selectedMonth as undefined - no month filter by default
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);

  // Get unique dates with proper error handling (sorted chronologically oldest to newest)
  const uniqueDates = useMemo(() => 
    getUniqueDates(conduces)
  , [conduces]);

  // Find the latest valid load date (ignoring typo future dates > tomorrow)
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
    
    return uniqueDates[uniqueDates.length - 1] || uniqueDates[0];
  }, [uniqueDates]);

  // Auto-sync selectedDate and dateRange whenever uniqueDates changes (initial load, region change, data update)
  useEffect(() => {
    if (uniqueDates.length === 0) {
      setSelectedDate('');
      return;
    }

    const maxAllowed = new Date();
    maxAllowed.setDate(maxAllowed.getDate() + 1);
    maxAllowed.setHours(23, 59, 59, 999);

    let latestValid = uniqueDates[uniqueDates.length - 1];
    let parsedLatest: Date | null = null;
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const parsed = safelyParseDate(uniqueDates[i]);
      if (parsed && parsed <= maxAllowed) {
        latestValid = uniqueDates[i];
        parsedLatest = parsed;
        break;
      }
    }

    // If current selectedDate is not present in uniqueDates, auto-select latest available date
    setSelectedDate(prevDate => {
      if (prevDate) {
        const normPrev = normalizeToDdMmYy(prevDate);
        if (uniqueDates.includes(normPrev)) {
          return normPrev;
        }
      }
      return latestValid;
    });

    // Ensure dateRange includes the month of the latest valid date
    if (parsedLatest) {
      setDateRange(prevRange => {
        if (!prevRange?.from || !prevRange?.to) {
          return { from: startOfMonth(parsedLatest!), to: endOfMonth(parsedLatest!) };
        }
        if (!isWithinInterval(parsedLatest!, { start: startOfDay(prevRange.from), end: endOfDay(prevRange.to) })) {
          return { from: startOfMonth(parsedLatest!), to: endOfMonth(parsedLatest!) };
        }
        return prevRange;
      });
    }
  }, [uniqueDates]);

  // Sync selectedMonth when dateRange changes
  useEffect(() => {
    if (dateRange?.from && isValid(dateRange.from)) {
      const monthStart = startOfMonth(dateRange.from);
      setSelectedMonth(monthStart);
    } else {
      setSelectedMonth(undefined);
    }
  }, [dateRange]);

  // Function to handle date navigation - navigate through all available dates
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    if (uniqueDates.length === 0) return;

    const normalizedCurrent = normalizeToDdMmYy(selectedDate);
    const currentIndex = uniqueDates.indexOf(normalizedCurrent);
    
    if (direction === 'prev') {
      if (currentIndex === -1) {
        const today = new Date();
        const closestPrevIndex = uniqueDates.findIndex((dateStr, idx, arr) => {
          if (idx === arr.length - 1) return true;
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
  }, [selectedDate, uniqueDates]);

  // Function to filter conduces by date range
  const filterConducesByDateRange = useMemo(() => {
    return (conducesList: Conduce[]) => {
      if (!dateRange?.from) {
        return conducesList;
      }
      
      return conducesList.filter(conduce => {
        try {
          if (!conduce || !conduce.fechaCarga) return false;
          
          const conduceDate = safelyParseDate(conduce.fechaCarga);
          if (!conduceDate || !isValid(conduceDate)) return false;
          
          if (dateRange.to && isValid(dateRange.to)) {
            const rangeStart = startOfDay(dateRange.from);
            const rangeEnd = endOfDay(dateRange.to);
            return isWithinInterval(conduceDate, { 
              start: rangeStart, 
              end: rangeEnd 
            });
          }
          
          return conduceDate >= startOfDay(dateRange.from);
        } catch (error) {
          console.error('Error filtering conduce by date range:', error);
          return false;
        }
      });
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
