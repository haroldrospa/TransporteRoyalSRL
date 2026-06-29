import React, { memo, useState, useCallback, Suspense, lazy, useMemo } from 'react';
import { EntregasLayout } from './EntregasLayout';
import { EntregasHeader } from './EntregasHeader';
import { EntregasStatsGrid } from './EntregasStatsGrid';
import { EntregasSearchBar } from './EntregasSearchBar';
import { EntregasSkeletonLoader } from './EntregasSkeletonLoader';
import { NoCamionAssigned } from './NoCamionAssigned';
import { DeliveryDialog } from './DeliveryDialog';
import { ReturnDialog } from './ReturnDialog';
import { useStatusBadgeRenderer } from './StatusBadgeRenderer';
import { useUltraFastEntregasData } from '@/hooks/useUltraFastEntregasData';
import { useEntregasDialogs } from '@/hooks/useEntregasDialogs';
import { useClienteBultosStats } from '@/hooks/useClienteBultosStats';
import { useOptimizedEntregasFilters } from '@/hooks/useOptimizedEntregasFilters';
import { useData } from '@/contexts/DataContext';
import { PendingScansAlert } from './PendingScansAlert';
import { Skeleton } from '@/components/ui/skeleton';
import { TruckDeliveryGrid } from './TruckDeliveryGrid';
import { useTruckDeliveryStats } from '@/hooks/useTruckDeliveryStats';
import { useSaveLocation } from '@/hooks/useSaveLocation';
import { MapChooserDialog } from './dialog/MapChooserDialog';

// Lazy load components for better performance
const LazyPendingOnlyTable = lazy(() => 
  import('./PendingOnlyTable').then(module => ({ default: module.PendingOnlyTable }))
);

const LazyAutoDeliveryDialog = lazy(() => 
  import('./AutoDeliveryDialog').then(module => ({ default: module.AutoDeliveryDialog }))
);

const LazyEntregaLAMDialog = lazy(() =>
  import('./EntregaLAMDialog').then(module => ({ default: module.EntregaLAMDialog }))
);

// Skeleton for tabs content
const TabsContentSkeleton = memo(() => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-2 mb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
    <div className="border rounded-lg">
      <div className="border-b bg-slate-50 p-4">
        <div className="grid grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

TabsContentSkeleton.displayName = 'TabsContentSkeleton';

export const FastLoadingEntregasMain = memo(() => {
  const [showAutoDeliveryDialog, setShowAutoDeliveryDialog] = useState(false);
  const [showEntregaLAMDialog, setShowEntregaLAMDialog] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true); // Por defecto oculto
  const [mapChooserOpen, setMapChooserOpen] = useState(false);
  const [activeUbicacion, setActiveUbicacion] = useState<string | undefined>(undefined);
  const [activeClienteNombre, setActiveClienteNombre] = useState<string | undefined>(undefined);
  
  // Use ultra fast data hook
  const {
    pendingDeliveries,
    completedDeliveries,
    returnedDeliveries,
    userConduces,
    loading,
    loadingCompleted,
    loadingReturned,
    stats,
    regionActual,
    hasCamion,
    isAdmin,
    searchTerm,
    setSearchTerm,
    handleRefreshData,
    loadMorePending
  } = useUltraFastEntregasData();

  // Use optimized filters hook
  const { 
    filteredPending, 
    filteredCompleted, 
    filteredReturned, 
    totalFilteredResults 
  } = useOptimizedEntregasFilters({
    pendingDeliveries,
    completedDeliveries,
    returnedDeliveries,
    searchTerm,
    selectedCity,
    selectedLab
  });

  const { renderStatusBadge } = useStatusBadgeRenderer();
  const { entregarConduce, devolverConduce, clientes, setRegionActual } = useData();
  const { handleSaveLocation, savingLocation } = useSaveLocation(clientes, handleRefreshData);

  // Memoize cliente bultos stats calculation
  const clienteBultosStats = useClienteBultosStats(userConduces);
  
  // Calculate truck delivery stats for all trucks
  const truckDeliveryStats = useTruckDeliveryStats(pendingDeliveries);

  // Use optimized dialogs hook
  const {
    showDeliveryDialog,
    setShowDeliveryDialog,
    showReturnDialog,
    setShowReturnDialog,
    selectedConduce,
    isSubmitting,
    handleDeliverySelection,
    handleReturnSelection,
    showDetails,
    handleDeliverySubmit,
    handleReturnSubmit,
    additionalConduces
  } = useEntregasDialogs(
    entregarConduce,
    devolverConduce,
    handleRefreshData,
    userConduces
  );

  // Optimized callback handlers
  const openGoogleMaps = useCallback((ubicacion: string | undefined, clienteNombre?: string) => {
    if (ubicacion) {
      setActiveUbicacion(ubicacion);
      setActiveClienteNombre(clienteNombre || 'Cliente');
      setMapChooserOpen(true);
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCity('');
    setSelectedLab('');
    setSearchTerm('');
  }, [setSearchTerm]);

  const handleAutoDelivery = useCallback(() => {
    setShowAutoDeliveryDialog(true);
  }, []);

  const handleEntregaLAM = useCallback(() => {
    setShowEntregaLAMDialog(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  const handleCloseAutoDelivery = useCallback(() => {
    setShowAutoDeliveryDialog(false);
  }, []);

  const handleCloseEntregaLAM = useCallback(() => {
    setShowEntregaLAMDialog(false);
  }, []);

  const handleToggleHeaderCollapse = useCallback(() => {
    setIsHeaderCollapsed(prev => !prev);
  }, []);

  // Create adjusted data for display - use skeletons for still loading data
  const displayCompletedDeliveries = loadingCompleted ? [] : completedDeliveries;
  const displayReturnedDeliveries = loadingReturned ? [] : returnedDeliveries;

  return (
    <div className="w-full h-full">
      {loading ? (
        <EntregasSkeletonLoader />
      ) : !hasCamion ? (
        <NoCamionAssigned />
      ) : (
        <>
      <EntregasLayout
        loading={isSubmitting}
        header={
          <EntregasHeader 
            regionActual={regionActual}
            onRefresh={handleRefreshData}
            onAutoDelivery={handleAutoDelivery}
            onEntregaLAM={handleEntregaLAM}
            loading={loading}
            isCollapsed={isHeaderCollapsed}
            onToggleCollapse={handleToggleHeaderCollapse}
            isAdmin={isAdmin}
            onRegionChange={(region) => {
              if (setRegionActual) {
                setRegionActual(region as any);
                // Also trigger a refresh when region changes
                setTimeout(() => handleRefreshData(), 100);
              }
            }}
          />
        }
        alerts={
          <PendingScansAlert userConduces={userConduces} />
        }
        stats={
          <>
            <EntregasStatsGrid
              stats={stats}
              pendingDeliveries={filteredPending}
              isAdmin={isAdmin}
            />
            {isAdmin && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Entregas por Camión</h3>
                <TruckDeliveryGrid truckStats={truckDeliveryStats} />
              </div>
            )}
          </>
        }
        search={null}
        content={
          <Suspense fallback={<TabsContentSkeleton />}>
            <LazyPendingOnlyTable
              filteredPending={filteredPending}
              handleDeliverySelection={handleDeliverySelection}
              handleReturnSelection={handleReturnSelection}
              openGoogleMaps={openGoogleMaps}
              showDetails={showDetails}
              renderStatusBadge={renderStatusBadge}
              isSubmitting={isSubmitting}
              clienteBultosStats={clienteBultosStats}
              isAdmin={isAdmin}
              searchBar={
                <EntregasSearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onClearSearch={handleClearSearch}
                  totalResults={(searchTerm || selectedCity || selectedLab) ? totalFilteredResults : undefined}
                  isFiltered={!!(searchTerm || selectedCity || selectedLab)}
                  selectedCity={selectedCity}
                  onCityChange={setSelectedCity}
                  selectedLab={selectedLab}
                  onLabChange={setSelectedLab}
                  onClearFilters={handleClearFilters}
                  allConduces={pendingDeliveries}
                />
              }
            />
          </Suspense>
        }
      />

      {/* Dialogs - Keep mounted while submitting to avoid unmounting during async work */}
      <DeliveryDialog
        conduce={selectedConduce}
        open={showDeliveryDialog && !!selectedConduce}
        onOpenChange={setShowDeliveryDialog}
        onSubmit={async (signature: string, note: string, image: string) => {
          if (!selectedConduce) return;
          await handleDeliverySubmit(
            selectedConduce,
            signature,
            note,
            image,
            () => setShowDeliveryDialog(false)
          );
        }}
        onSaveLocation={handleSaveLocation}
        openGoogleMaps={openGoogleMaps}
        isSubmitting={isSubmitting}
        savingLocation={savingLocation}
        additionalConduces={additionalConduces}
      />

      <ReturnDialog
        conduce={selectedConduce}
        open={showReturnDialog && !!selectedConduce}
        onOpenChange={setShowReturnDialog}
        onSubmit={async (note: string) => {
          if (!selectedConduce) return;
          await handleReturnSubmit(
            selectedConduce,
            note,
            () => setShowReturnDialog(false)
          );
        }}
        isSubmitting={isSubmitting}
      />

      {/* Auto Delivery Dialog - Lazy loaded */}
      <Suspense fallback={null}>
        {showAutoDeliveryDialog && (
          <LazyAutoDeliveryDialog
            open={showAutoDeliveryDialog}
            onOpenChange={handleCloseAutoDelivery}
            onDeliveryComplete={handleRefreshData}
          />
        )}
      </Suspense>

      {/* Entrega LAM Dialog - Lazy loaded */}
      <Suspense fallback={null}>
        {showEntregaLAMDialog && (
          <LazyEntregaLAMDialog
            open={showEntregaLAMDialog}
            onOpenChange={handleCloseEntregaLAM}
            onSuccess={handleRefreshData}
          />
        )}
      </Suspense>

      <MapChooserDialog
        open={mapChooserOpen}
        onOpenChange={setMapChooserOpen}
        ubicacion={activeUbicacion}
        clienteNombre={activeClienteNombre}
      />
        </>
      )}
    </div>
  );
});

FastLoadingEntregasMain.displayName = 'FastLoadingEntregasMain';