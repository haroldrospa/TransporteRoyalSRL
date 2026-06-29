
import { lazy, Suspense, memo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { parseDeliveryTime } from '@/utils/lamUtils';
import LAMHeader from '@/components/lam/LAMHeader';
import LAMLoadingStateOptimized from '@/components/lam/LAMLoadingStateOptimized';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

import LAMNoDataCard from '@/components/lam/LAMNoDataCard';

// Lazy load heavy components
const LAMDateRangeSelector = lazy(() => import('@/components/lam/LAMDateRangeSelector'));
const LAMStatsAndCharts = lazy(() => import('@/components/lam/LAMStatsAndCharts'));
const LamStats = lazy(() => import('@/components/lam/LamStats'));
const ConduceDetailsDialog = lazy(() => import('@/components/lam/ConduceDetailsDialog'));
const RegionToggle = lazy(() => import('@/components/lam/RegionToggle'));
const ConducesTableSection = lazy(() => import('@/components/lam/ConducesTableSection'));
const EntregasLAMSection = lazy(() => import('@/components/lam/EntregasLAMSection'));

import { useLAMContent } from '@/hooks/useLAMContent';

const LAMContent = memo(() => {
  const { user } = useAuth();
  const [showEntregasLAM, setShowEntregasLAM] = useState(false);
  
  const {
    loading,
    regionActual,
    handleRegionChange,
    dateRange,
    setDateRange,
    tableSearchTerm,
    setTableSearchTerm,
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedConduce,
    showDetailsDialog,
    setShowDetailsDialog,
    stats,
    chartInfo,
    bultosMonthlyData,
    uniqueDates,
    latestLoadDate,
    sortedConduces,
    handleSaveConduceChanges,
    handleConduceClick,
    handleRefresh,
    navigateDate,
    hasNoData,
    loadConduceImage,
    statsFilteredConduces,
    regionConduces,
    estadoFilter,
    handleStateFilter,
    totalConducesCount
  } = useLAMContent();

  if (loading) {
    return <LAMLoadingStateOptimized laboratorio="LAM" />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <LAMHeader 
        regionActual={regionActual}
        loading={loading}
        onRefresh={handleRefresh}
        conduces={statsFilteredConduces || []}
        stats={stats}
        chartInfo={chartInfo}
      />

      {hasNoData ? (
        <LAMNoDataCard />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <Suspense fallback={<div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>}>
              <RegionToggle 
                regionActual={regionActual}
                onRegionChange={handleRegionChange}
              />
            </Suspense>
            
            <Button
              onClick={() => setShowEntregasLAM(!showEntregasLAM)}
              variant={showEntregasLAM ? "default" : "outline"}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              {showEntregasLAM ? 'Ver Conduces' : 'Ver Entregas LAM'}
            </Button>
          </div>

          <Suspense fallback={<div className="h-12 bg-gray-200 animate-pulse rounded mb-4"></div>}>
            <LAMDateRangeSelector 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </Suspense>

          <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse rounded mb-4"></div>}>
            <LAMStatsAndCharts 
              chartInfo={chartInfo}
              allConduces={regionConduces || []}
              conduces={statsFilteredConduces || []}
              onStateFilter={handleStateFilter}
              bultosTotalCount={stats.bultosTotalCount}
              onMonthSelect={setDateRange}
            />
          </Suspense>

          {!showEntregasLAM && (
            <>
              <Suspense fallback={<div className="h-24 bg-gray-200 animate-pulse rounded mb-4"></div>}>
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

              <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded"></div>}>
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
                  totalConducesCount={totalConducesCount}
                />
              </Suspense>
            </>
          )}

          {showEntregasLAM && (
            <Suspense fallback={<div className="h-96 bg-gray-200 animate-pulse rounded"></div>}>
              <EntregasLAMSection />
            </Suspense>
          )}
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

LAMContent.displayName = 'LAMContent';

export default LAMContent;
