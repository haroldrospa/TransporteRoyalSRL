
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useDateRangeSelector } from '@/hooks/useDateRangeSelector';
import { formatDateRange } from '@/utils/dateFormatting';
import { DateRangePicker } from './DateRange/DateRangePicker';
import { MonthSelector } from './DateRange/MonthSelector';

interface LAMDateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const LAMDateRangeSelector = ({ dateRange, onDateRangeChange }: LAMDateRangeSelectorProps) => {
  const { isExpanded, handleMonthSelect, toggleExpand } = useDateRangeSelector(dateRange, onDateRangeChange);

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        onClick={toggleExpand}
        className="w-full flex justify-between items-center"
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {formatDateRange(dateRange)}
        </span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <DateRangePicker
              label="Desde"
              selected={dateRange?.from}
              onSelect={(date) => 
                onDateRangeChange({ 
                  from: date, 
                  to: dateRange?.to 
                })
              }
            />
            <DateRangePicker
              label="Hasta"
              selected={dateRange?.to}
              onSelect={(date) => 
                onDateRangeChange({ 
                  from: dateRange?.from, 
                  to: date 
                })
              }
            />
          </div>
          <MonthSelector onMonthSelect={handleMonthSelect} />
        </div>
      )}
    </div>
  );
};

export default LAMDateRangeSelector;
