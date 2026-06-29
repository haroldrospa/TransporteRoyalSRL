
import { lazy, Suspense, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { parseDeliveryTime } from '@/utils/lamUtils';
import InnovacionQuimicaHeader from './InnovacionQuimicaHeader';
import LAMLoadingStateOptimized from '@/components/lam/LAMLoadingStateOptimized';

const LAMDateRangeSelector = lazy(() => import('@/components/lam/LAMDateRangeSelector'));
const LAMStatsAndCharts = lazy(() => import('@/components/lam/LAMStatsAndCharts'));
const LamStats = lazy(() => import('@/components/lam/LamStats'));
const ConduceDetailsDialog = lazy(() => import('@/components/lam/ConduceDetailsDialog'));
const InnovacionQuimicaNoDataCard = lazy(() => import('./InnovacionQuimicaNoDataCard'));
const RegionToggle = lazy(() => import('@/components/lam/RegionToggle'));
const ConducesTableSection = lazy(() => import('@/components/lam/ConducesTableSection'));

import { useInnovacionQuimicaContent } from '@/hooks/useInnovacionQuimicaContent';

const InnovacionQuimicaContent = memo(() => {
  const { user } = useAuth();
  
  const {
    loading, regionActual, handleRegionChange,
    dateRange, setDateRange,
    tableSearchTerm, setTableSearchTerm,
    selectedDate, setSelectedDate,
    selectedMonth, setSelectedMonth,
    selectedConduce, showDetailsDialog, setShowDetailsDialog,
    stats, chartInfo,
    uniqueDates, latestLoadDate,
    sortedConduces,
    handleSaveConduceChanges, handleConduceClick,
    handleRefresh, navigateDate,
    hasNoData, loadConduceImage,
    regionConduces, statsFilteredConduces,
    estadoFilter, handleStateFilter
  } = useInnovacionQuimicaContent();

  if (loading) {
    return <LAMLoadingStateOptimized />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <InnovacionQuimicaHeader 
        regionActual={regionActual}
        loading={loading}
        onRefresh={handleRefresh}
        conduces={regionConduces || []}
        stats={stats}
        chartInfo={chartInfo}
      />

      {hasNoData ? (
        <Suspense fallback={<div className="h-32 flex items-center justify-center">Cargando...</div>}>
          <InnovacionQuimicaNoDataCard />
        </Suspense>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <Suspense fallback={<div className="h-8 w-32 bg-muted animate-pulse rounded"></div>}>
              <RegionToggle regionActual={regionActual} onRegionChange={handleRegionChange} />
            </Suspense>
          </div>

          <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded mb-4"></div>}>
            <LAMDateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
          </Suspense>

          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded mb-4"></div>}>
            <LAMStatsAndCharts 
              chartInfo={chartInfo} allConduces={regionConduces || []}
              conduces={statsFilteredConduces || []} onStateFilter={handleStateFilter}
              bultosTotalCount={stats.bultosTotalCount}
              onMonthSelect={setDateRange}
            />
          </Suspense>

          <Suspense fallback={<div className="h-24 bg-muted animate-pulse rounded mb-4"></div>}>
            <LamStats 
              latestLoadDate={latestLoadDate}
              bultosEnTransito={stats.bultosEnTransito}
              bultosTotalCount={stats.bultosTotalCount}
              clientesEnTransito={stats.clientesEnTransito}
              bultosEntregados={stats.bultosEntregados}
              bultosDevueltos={stats.bultosDevueltos}
              bultosAtrasados={stats.bultosAtrasados}
              totalBultosEntregadosDB={stats.totalBultosEntregadosDB}
              onStateFilter={handleStateFilter}
            />
          </Suspense>

          <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded"></div>}>
            <ConducesTableSection
              conduces={sortedConduces || []}
              searchTerm={tableSearchTerm}
              selectedDate={selectedDate}
              selectedMonth={selectedMonth}
              uniqueDates={uniqueDates}
              onSearchChange={setTableSearchTerm}
              onDateChange={setSelectedDate}
              onMonthChange={setSelectedMonth}
              onConduceClick={handleConduceClick}
              parseDeliveryTime={parseDeliveryTime}
              navigateDate={navigateDate}
              estadoFilter={estadoFilter}
            />
          </Suspense>
        </>
      )}

      <Suspense fallback={null}>
        <ConduceDetailsDialog 
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          selectedConduce={selectedConduce}
          onSaveChanges={handleSaveConduceChanges}
          userNivel={user?.nivel}
          parseDeliveryTime={parseDeliveryTime}
          loadConduceImage={loadConduceImage}
        />
      </Suspense>
    </div>
  );
});

InnovacionQuimicaContent.displayName = 'InnovacionQuimicaContent';

export default InnovacionQuimicaContent;
