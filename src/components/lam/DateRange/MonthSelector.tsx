
import { Button } from '@/components/ui/button';
import { monthButtons } from '@/constants/dateConstants';

interface MonthSelectorProps {
  onMonthSelect: (index: number) => void;
}

export const MonthSelector = ({ onMonthSelect }: MonthSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {monthButtons.map((month, index) => (
        <Button
          key={month.key}
          variant="outline"
          className="w-full"
          onClick={() => onMonthSelect(index)}
        >
          {month.label}
        </Button>
      ))}
    </div>
  );
};
