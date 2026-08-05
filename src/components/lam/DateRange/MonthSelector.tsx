
import { Button } from '@/components/ui/button';
import { monthButtons } from '@/constants/dateConstants';

interface MonthSelectorProps {
  onMonthSelect: (index: number) => void;
  selectedMonthIndex?: number;
}

export const MonthSelector = ({ onMonthSelect, selectedMonthIndex }: MonthSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {monthButtons.map((month, index) => {
        const isSelected = selectedMonthIndex === index;
        return (
          <Button
            key={month.key}
            variant={isSelected ? "default" : "outline"}
            className={`w-full transition-all ${isSelected ? "bg-royal-blue text-white hover:bg-royal-blue/90 font-bold shadow-sm" : ""}`}
            onClick={() => onMonthSelect(index)}
          >
            {month.label}
          </Button>
        );
      })}
    </div>
  );
};
