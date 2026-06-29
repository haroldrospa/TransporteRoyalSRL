
import { Search, Calendar as CalendarIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface LAMFiltersProps {
  searchTerm: string;
  selectedDate: string;
  selectedMonth: Date | undefined;
  uniqueDates: string[];
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onMonthChange: (value: Date | undefined) => void;
  estadoFilter?: string;
}

const LAMFilters = ({
  searchTerm,
  selectedDate,
  selectedMonth,
  uniqueDates,
  onSearchChange,
  onDateChange,
  onMonthChange,
  estadoFilter
}: LAMFiltersProps) => {
  const [openDate, setOpenDate] = useState(false);
  const [openMonth, setOpenMonth] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm || '');

  // Sync local input when parent resets searchTerm (e.g. "Limpiar filtros")
  useEffect(() => {
    setLocalSearch(searchTerm || '');
  }, [searchTerm]);

  const submitSearch = () => {
    onSearchChange(localSearch.trim());
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  // Parse date string from DD/MM/YY format to Date object with robust error handling
  const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      // Basic validation
      if (!/^\d{2}\/\d{2}\/\d{2}$/.test(dateStr)) {
        console.error("Invalid date format:", dateStr);
        return undefined;
      }
      
      // Parse the date string
      const dateParts = dateStr.split('/');
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // months are 0-indexed
      const year = 2000 + parseInt(dateParts[2], 10); // Assuming 20xx year
      
      // Create date at noon to prevent timezone issues
      const parsedDate = new Date(year, month, day, 12, 0, 0);

      // Check if the date is valid before returning
      if (!isValid(parsedDate)) {
        console.error("Invalid date parsed:", dateStr);
        return undefined;
      }
      return parsedDate;
    } catch (error) {
      console.error("Error parsing date string in LAMFilters:", error, dateStr);
      return undefined;
    }
  };

  // Format selected date for display with robust error handling
  const formatDateForDisplay = (date: Date | undefined): string => {
    if (!date || !isValid(date)) return '';
    try {
      return format(date, "dd/MM/yy");
    } catch (error) {
      console.error("Error formatting date for display:", error);
      return '';
    }
  };

  // Safely check if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    if (!date || !isValid(date)) return true;
    try {
      const formatted = format(date, "dd/MM/yy");
      return !Array.isArray(uniqueDates) || !uniqueDates.includes(formatted);
    } catch (error) {
      console.error("Error checking disabled date:", error);
      return true;
    }
  };

  // Safe check for selected month formatting
  const formatSelectedMonth = (): string => {
    try {
      return selectedMonth && isValid(selectedMonth) 
        ? format(selectedMonth, 'MMMM yyyy', { locale: es }) 
        : '';
    } catch (error) {
      console.error("Error formatting selected month:", error);
      return '';
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xl">
      <div className="relative flex w-full items-center shadow-sm rounded-lg overflow-hidden border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-royal-blue/20 focus-within:border-royal-blue/50 transition-all">
        <div className="pl-3 pr-2 text-slate-400 flex items-center justify-center h-full">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          placeholder="Buscar factura, cliente, ciudad..."
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-10 px-0 flex-1 min-w-0"
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitSearch();
            }
          }}
        />
        {localSearch && (
          <button 
            type="button"
            onClick={clearSearch}
            className="px-3 text-slate-400 hover:text-royal-blue h-full flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Button 
          type="button" 
          onClick={submitSearch} 
          className="rounded-none h-10 bg-royal-blue hover:bg-blue-800 px-4 shrink-0 transition-colors"
        >
          <span className="hidden sm:inline font-medium text-white">Buscar</span>
          <Search className="h-4 w-4 sm:hidden text-white" />
        </Button>
      </div>

      {/* Active Filters Row */}
      {(estadoFilter || selectedDate || selectedMonth || searchTerm) && (
        <div className="flex flex-wrap gap-2 items-center pt-2 animate-in slide-in-from-top-1 fade-in duration-200">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Filtros Activos:</span>
          
          {estadoFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-royal-blue/5 text-royal-blue border border-royal-blue/20 rounded-full text-[11px] font-semibold">
              Estado: {estadoFilter}
            </div>
          )}
          
          {searchTerm && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-semibold">
              Búsqueda: {searchTerm}
            </div>
          )}

          {selectedDate && (
             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-semibold">
               Fecha: {formatDateForDisplay(parseDateString(selectedDate))}
             </div>
          )}

          {selectedMonth && (
             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-semibold">
               Mes: {formatSelectedMonth()}
             </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2.5 text-[11px] text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full ml-1"
            onClick={() => {
              onDateChange('');
              onMonthChange(undefined);
              clearSearch();
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar todos
          </Button>
        </div>
      )}
    </div>
  );
};

export default LAMFilters;
