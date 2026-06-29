
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DateNavigationProps {
  selectedDate: string;
  onPrevious: () => void;
  onNext: () => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  uniqueDates?: string[];
  onDateChange?: (value: string) => void;
}

const parseSelected = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const yearPart = dateStr.split('/')[2] || '';
  const primary = yearPart.length === 2 ? 'dd/MM/yy' : 'dd/MM/yyyy';
  const fallback = yearPart.length === 2 ? 'dd/MM/yyyy' : 'dd/MM/yy';
  let parsed = parse(dateStr, primary, new Date());
  if (!isValid(parsed)) parsed = parse(dateStr, fallback, new Date());
  return isValid(parsed) ? parsed : undefined;
};

const DateNavigation = ({
  selectedDate,
  onPrevious,
  onNext,
  canNavigatePrev,
  canNavigateNext,
  uniqueDates = [],
  onDateChange,
}: DateNavigationProps) => {
  const [open, setOpen] = useState(false);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return 'Seleccionar fecha';
    const parsed = parseSelected(dateStr);
    return parsed ? format(parsed, 'EEE d MMM yyyy', { locale: es }) : dateStr;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (!date || !isValid(date)) return true;
    if (!uniqueDates.length) return false;
    const f2 = format(date, 'dd/MM/yy');
    const f4 = format(date, 'dd/MM/yyyy');
    return !uniqueDates.includes(f2) && !uniqueDates.includes(f4);
  };

  return (
    <div className="flex items-center gap-1 bg-primary/5 rounded-lg px-2 py-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!canNavigatePrev}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 min-w-[160px] justify-center gap-2 font-medium text-sm capitalize"
          >
            <CalendarIcon className="h-4 w-4 text-primary" />
            {formatDisplayDate(selectedDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={parseSelected(selectedDate)}
            onSelect={(date) => {
              if (date && isValid(date) && onDateChange) {
                date.setHours(12, 0, 0, 0);
                onDateChange(format(date, 'dd/MM/yy'));
                setOpen(false);
              }
            }}
            disabled={isDateDisabled}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canNavigateNext}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {selectedDate && onDateChange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange('')}
          className="h-8 w-8"
          title="Limpiar fecha"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default DateNavigation;
