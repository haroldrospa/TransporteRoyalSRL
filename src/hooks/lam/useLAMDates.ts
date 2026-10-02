
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

  // Sync selectedMonth and selectedDate when dateRange changes
  useEffect(() => {
    if (!dateRange?.from || !isValid(dateRange.from)) {
      setSelectedMonth(undefined);
      return;
    }

    const monthStart = startOfMonth(dateRange.from);
    setSelectedMonth(monthStart);

    const rangeStart = startOfDay(dateRange.from);
    const rangeEnd = dateRange.to && isValid(dateRange.to) ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    // If current selectedDate is already within this new dateRange, keep it
    if (selectedDate) {
      const parsedSel = safelyParseDate(selectedDate);
      if (parsedSel && isValid(parsedSel) && isWithinInterval(parsedSel, { start: rangeStart, end: rangeEnd })) {
        return;
      }
    }

    // Otherwise, pick the latest date in uniqueDates that falls within this dateRange
    if (uniqueDates.length > 0) {
      const inRange = uniqueDates.filter(d => {
        const pd = safelyParseDate(d);
        return pd && isValid(pd) && isWithinInterval(pd, { start: rangeStart, end: rangeEnd });
      });

      if (inRange.length > 0) {
        setSelectedDate(inRange[inRange.length - 1]);
      } else {
        setSelectedDate('');
      }
    }
  }, [dateRange, uniqueDates]);

  // When selectedDate is changed to a date outside current dateRange, update dateRange to that month
  useEffect(() => {
    if (!selectedDate) return;
    const parsed = safelyParseDate(selectedDate);
    if (!parsed || !isValid(parsed)) return;

    if (!dateRange?.from || !dateRange?.to) {
      setDateRange({ from: startOfMonth(parsed), to: endOfMonth(parsed) });
      return;
    }

    const rangeStart = startOfDay(dateRange.from);
    const rangeEnd = endOfDay(dateRange.to);

    if (!isWithinInterval(parsed, { start: rangeStart, end: rangeEnd })) {
      setDateRange({ from: startOfMonth(parsed), to: endOfMonth(parsed) });
    }
  }, [selectedDate]);

  // Function to handle date navigation - navigate through all available dates
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    if (uniqueDates.length === 0) return;

    const normalizedCurrent = normalizeToDdMmYy(selectedDate);
    const currentIndex = uniqueDates.indexOf(normalizedCurrent);
    
    let targetIndex = -1;
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
        targetIndex = closestPrevIndex >= 0 ? closestPrevIndex : uniqueDates.length - 1;
      } else if (currentIndex > 0) {
        targetIndex = currentIndex - 1;
      }
    } else if (direction === 'next') {
      if (currentIndex === -1) {
        const today = new Date();
        const closestNextIndex = uniqueDates.findIndex((dateStr) => {
          const dateParsed = safelyParseDate(dateStr);
          if (!dateParsed) return false;
          return dateParsed > today;
        });
        targetIndex = closestNextIndex >= 0 ? closestNextIndex : -1;
      } else if (currentIndex < uniqueDates.length - 1) {
        targetIndex = currentIndex + 1;
      }
    }

    if (targetIndex >= 0 && targetIndex < uniqueDates.length) {
      const newDate = uniqueDates[targetIndex];
      setSelectedDate(newDate);
      const parsed = safelyParseDate(newDate);
      if (parsed && isValid(parsed)) {
        const rangeStart = dateRange?.from ? startOfDay(dateRange.from) : null;
        const rangeEnd = dateRange?.to ? endOfDay(dateRange.to) : rangeStart;
        if (!rangeStart || !rangeEnd || !isWithinInterval(parsed, { start: rangeStart, end: rangeEnd })) {
          setDateRange({ from: startOfMonth(parsed), to: endOfMonth(parsed) });
        }
      }
    }
  }, [selectedDate, uniqueDates, dateRange]);

  // Function to filter conduces strictly by date range (e.g. Month or custom interval)
  const filterConducesByDateRange = useMemo(() => {
    return (conducesList: Conduce[]) => {
      if (!conducesList || conducesList.length === 0) return [];

      if (!dateRange?.from) {
        return conducesList;
      }
      
      const rangeStart = startOfDay(dateRange.from);
      const rangeEnd = dateRange.to && isValid(dateRange.to) ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

      return conducesList.filter(conduce => {
        try {
          if (!conduce?.fechaCarga) return false;
          const cargaDate = safelyParseDate(conduce.fechaCarga);
          if (!cargaDate || !isValid(cargaDate)) return false;
          return isWithinInterval(cargaDate, { start: rangeStart, end: rangeEnd });
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
