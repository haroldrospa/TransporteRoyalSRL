
import { useState, useEffect, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, isWithinInterval, isValid, format, startOfDay, endOfDay, addDays } from 'date-fns';
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

  // Find the latest valid load date (only from fechaCarga, not futuras fechaEntrega)
  const latestLoadDate = useMemo(() => {
    if (uniqueDates.length === 0) return '';
    
    const maxAllowed = addDays(new Date(), 60);
    const minAllowed = new Date(2020, 0, 1);

    // Only look at fechaCarga dates from the conduces (not fechaEntrega)
    const cargaDates: string[] = [];
    conduces.forEach(c => {
      if (!c?.fechaCarga) return;
      const d = safelyParseDate(c.fechaCarga);
      if (d && isValid(d) && d >= minAllowed && d <= maxAllowed) {
        cargaDates.push(format(d, 'dd/MM/yy'));
      }
    });

    if (cargaDates.length > 0) {
      const sorted = Array.from(new Set(cargaDates)).sort((a, b) => {
        const da = safelyParseDate(a);
        const db = safelyParseDate(b);
        if (da && db) return da.getTime() - db.getTime();
        return 0;
      });
      return sorted[sorted.length - 1];
    }
    
    // Fallback: last in uniqueDates
    return uniqueDates[uniqueDates.length - 1] || '';
  }, [uniqueDates, conduces]);

  // Auto-sync selectedDate and dateRange whenever uniqueDates or conduces changes
  useEffect(() => {
    if (uniqueDates.length === 0) {
      setSelectedDate('');
      return;
    }

    const maxAllowed = addDays(new Date(), 60);
    const minAllowed = new Date(2020, 0, 1);

    // Find latest fechaCarga date
    const cargaDates: string[] = [];
    conduces.forEach(c => {
      if (!c?.fechaCarga) return;
      const d = safelyParseDate(c.fechaCarga);
      if (d && isValid(d) && d >= minAllowed && d <= maxAllowed) {
        cargaDates.push(format(d, 'dd/MM/yy'));
      }
    });

    let latestValid = uniqueDates[uniqueDates.length - 1];
    let parsedLatest: Date | null = null;

    if (cargaDates.length > 0) {
      const sorted = Array.from(new Set(cargaDates)).sort((a, b) => {
        const da = safelyParseDate(a);
        const db = safelyParseDate(b);
        if (da && db) return da.getTime() - db.getTime();
        return 0;
      });
      latestValid = sorted[sorted.length - 1];
      parsedLatest = safelyParseDate(latestValid);
    } else {
      // Fallback: scan uniqueDates for a valid date in range
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const parsed = safelyParseDate(uniqueDates[i]);
        if (parsed && isValid(parsed) && parsed >= minAllowed && parsed <= maxAllowed) {
          latestValid = uniqueDates[i];
          parsedLatest = parsed;
          break;
        }
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

    // Always update dateRange to the month of the latest valid CARGA date
    if (parsedLatest && isValid(parsedLatest)) {
      setDateRange({ from: startOfMonth(parsedLatest), to: endOfMonth(parsedLatest) });
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
          if (!conduce) return false;
          
          const cargaDate = safelyParseDate(conduce.fechaCarga);
          const entregaDate = safelyParseDate(conduce.fechaEntrega);
          
          if ((!cargaDate || !isValid(cargaDate)) && (!entregaDate || !isValid(entregaDate))) return false;
          
          if (dateRange.to && isValid(dateRange.to)) {
            const rangeStart = startOfDay(dateRange.from);
            const rangeEnd = endOfDay(dateRange.to);
            const inCarga = cargaDate && isValid(cargaDate) && isWithinInterval(cargaDate, { start: rangeStart, end: rangeEnd });
            const inEntrega = entregaDate && isValid(entregaDate) && isWithinInterval(entregaDate, { start: rangeStart, end: rangeEnd });
            return inCarga || inEntrega;
          }
          
          const inCarga = cargaDate && isValid(cargaDate) && cargaDate >= startOfDay(dateRange.from);
          const inEntrega = entregaDate && isValid(entregaDate) && entregaDate >= startOfDay(dateRange.from);
          return inCarga || inEntrega;
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
