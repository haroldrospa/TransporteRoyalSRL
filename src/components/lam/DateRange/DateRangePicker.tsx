
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateRangePickerProps {
  label: string;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
}

export const DateRangePicker = ({ label, selected, onSelect }: DateRangePickerProps) => {
  return (
    <div className="flex-1">
      <label className="text-sm font-medium mb-2 block text-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected && isValid(selected) ? (
              format(selected, "dd/MM/yyyy")
            ) : (
              <span>Seleccionar fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            locale={es}
            selected={selected && isValid(selected) ? selected : undefined}
            onSelect={(date) => {
              if (date && isValid(date)) {
                const fixedDate = new Date(date);
                fixedDate.setHours(12, 0, 0, 0);
                onSelect(fixedDate);
              }
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
