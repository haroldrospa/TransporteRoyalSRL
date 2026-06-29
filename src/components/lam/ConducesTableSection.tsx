
import { Card, CardContent } from '@/components/ui/card';
import { memo, useMemo } from 'react';
import ConducesTable from '@/components/lam/ConducesTable';
import LAMFilters from '@/components/lam/LAMFilters';
import DateNavigation from '@/components/lam/DateNavigation';
import TableBultosStats from '@/components/lam/TableBultosStats';
import { Conduce } from '@/types/conduces';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConducesTableSectionProps {
  conduces: Conduce[];
  searchTerm: string;
  selectedDate: string;
  selectedMonth: Date | undefined;
  uniqueDates: string[];
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onMonthChange: (value: Date | undefined) => void;
  onConduceClick: (conduce: Conduce) => void;
  parseDeliveryTime: (timeStr: string) => number;
  navigateDate: (direction: 'prev' | 'next') => void;
  estadoFilter?: string;
  totalConducesCount?: number;
}

const ConducesTableSection = memo(({
  conduces,
  searchTerm,
  selectedDate,
  selectedMonth,
  uniqueDates,
  onSearchChange,
  onDateChange,
  onMonthChange,
  onConduceClick,
  parseDeliveryTime,
  navigateDate,
  estadoFilter,
  totalConducesCount = 0
}: ConducesTableSectionProps) => {
  const isMobile = useIsMobile();
  
  // Memoize navigation state
  const navigationState = useMemo(() => {
    const currentIndex = selectedDate ? uniqueDates.indexOf(selectedDate) : -1;
    return {
      canNavigatePrev: currentIndex > 0,
      canNavigateNext: currentIndex >= 0 && currentIndex < uniqueDates.length - 1
    };
  }, [selectedDate, uniqueDates]);

  return (
    <Card className="shadow-md">
      <CardContent className={`${isMobile ? 'p-3' : 'p-4'} flex flex-col gap-4 bg-slate-50/30`}>
        {/* Toolbar Container */}
        <div className="flex flex-col gap-3">
          
          {/* Main Controls Row: Date Nav & Search */}
          <div className="flex flex-col gap-4 justify-center items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full">
            {/* Date Nav on top and centered */}
            <div className="shrink-0 w-full flex justify-center">
              <DateNavigation
                selectedDate={selectedDate}
                onPrevious={() => navigateDate('prev')}
                onNext={() => navigateDate('next')}
                canNavigatePrev={navigationState.canNavigatePrev}
                canNavigateNext={navigationState.canNavigateNext}
                uniqueDates={uniqueDates}
                onDateChange={onDateChange}
              />
            </div>
            {/* Search Filters below */}
            <div className="w-full max-w-xl">
              <LAMFilters
                searchTerm={searchTerm}
                selectedDate={selectedDate}
                selectedMonth={selectedMonth}
                uniqueDates={uniqueDates}
                onSearchChange={onSearchChange}
                onDateChange={onDateChange}
                onMonthChange={onMonthChange}
                estadoFilter={estadoFilter}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full bg-white border border-slate-200 shadow-sm px-3 py-2.5 rounded-lg">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-royal-blue/5 rounded-md border border-royal-blue/10 shrink-0">
              <span className="font-bold text-royal-blue text-sm">{conduces.length.toLocaleString()}</span>
              {totalConducesCount > 0 && totalConducesCount !== conduces.length && (
                <span className="text-xs text-slate-500 font-medium ml-1">de {totalConducesCount.toLocaleString()}</span>
              )}
              <span className="text-[11px] text-royal-blue/80 font-bold uppercase tracking-wider ml-1">Conduces</span>
            </div>

            <div className="hidden sm:block w-px h-5 bg-slate-200" />
            
            <TableBultosStats conduces={conduces} />
          </div>
        </div>
        <ConducesTable 
          conduces={conduces}
          onConduceClick={onConduceClick}
          parseDeliveryTime={parseDeliveryTime}
        />
      </CardContent>
    </Card>
  );
});

ConducesTableSection.displayName = 'ConducesTableSection';

export default ConducesTableSection;
