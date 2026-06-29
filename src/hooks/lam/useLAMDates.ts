
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

  // Sync selectedMonth when dateRange changes
  useEffect(() => {
    if (dateRange?.from && isValid(dateRange.from)) {
      const monthStart = startOfMonth(dateRange.from);
      console.log('🔄 Syncing selectedMonth with dateRange:', dateRange.from, '-> month:', monthStart);
      setSelectedMonth(monthStart);
    } else {
      console.log('🔄 Clearing selectedMonth because dateRange is not set');
      setSelectedMonth(undefined);
    }
  }, [dateRange]);

  // Get unique dates with proper error handling
  const uniqueDates = useMemo(() => 
    getUniqueDates(conduces)
  , [conduces]);
  
  // Set selectedDate to latest load date when data loads
  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      const latestDate = uniqueDates[uniqueDates.length - 1];
      console.log('📅 Setting initial selectedDate to latest load date:', latestDate);
      setSelectedDate(latestDate);
    }
  }, [uniqueDates, selectedDate]);
  
  const latestLoadDate = useMemo(() => 
    uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : ''
  , [uniqueDates]);

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
        console.log('📅 No dateRange.from - returning all conduces:', regionConduces.length);
        return regionConduces;
      }
      
      console.log('📅 Filtering by dateRange:', dateRange);
      console.log('📅 Sample conduce dates:', regionConduces.slice(0, 3).map(c => ({ numero: c.numeroConduce, fecha: c.fechaEntrega })));
      
      const filtered = regionConduces.filter(conduce => {
        try {
          if (!conduce || !conduce.fechaEntrega) return false;
          
          const conduceDate = safelyParseDate(conduce.fechaEntrega);
          if (!conduceDate || !isValid(conduceDate)) return false;
          
          // If both from and to dates are set, check if within interval
          if (dateRange.to && isValid(dateRange.to)) {
            const rangeStart = startOfDay(dateRange.from);
            const rangeEnd = endOfDay(dateRange.to);
            const inRange = isWithinInterval(conduceDate, { 
              start: rangeStart, 
              end: rangeEnd 
            });
            if (!inRange) {
              console.log('📅 NOT in range:', conduce.numeroConduce, conduceDate, 'vs', { start: rangeStart, end: rangeEnd });
            }
            return inRange;
          }
          
          // If only from date is set, check if on or after that date
          return conduceDate >= startOfDay(dateRange.from);
        } catch (error) {
          console.error('Error filtering conduce by date range:', error);
          return false;
        }
      });
      
      console.log('📅 Filtered result count:', filtered.length);
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
