
import { useMemo, useState } from 'react';
import { EntregasLayout } from './EntregasLayout';
import { EntregasHeader } from './EntregasHeader';
import { EntregasStatsGrid } from './EntregasStatsGrid';
import { EntregasSearchBar } from './EntregasSearchBar';
import { EntregasTabsContent } from './EntregasTabsContent';
import { LoadingSpinner } from './LoadingSpinner';
import { NoCamionAssigned } from './NoCamionAssigned';
import { DeliveryDialog } from './DeliveryDialog';
import { ReturnDialog } from './ReturnDialog';
import { AutoDeliveryDialog } from './AutoDeliveryDialog';
import { EntregaLAMDialog } from './EntregaLAMDialog';
import { useStatusBadgeRenderer } from './StatusBadgeRenderer';
import { useOptimizedEntregasDataFast } from '@/hooks/useOptimizedEntregasDataFast';
import { useEntregasDialogs } from '@/hooks/useEntregasDialogs';
import { useClienteBultosStats } from '@/hooks/useClienteBultosStats';
import { useData } from '@/contexts/DataContext';
import { PendingScansAlert } from './PendingScansAlert';
import { useSaveLocation } from '@/hooks/useSaveLocation';

export const EntregasMain = () => {
  const [showAutoDeliveryDialog, setShowAutoDeliveryDialog] = useState(false);
  const [showEntregaLAMDialog, setShowEntregaLAMDialog] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  
  // Usar datos optimizados para entregas
  const {
    loading,
    regionActual,
    searchTerm,
    setSearchTerm,
    pendingDeliveries,
    completedDeliveries,
    returnedDeliveries,
    handleRefreshData,
    hasCamion,
    stats,
    userConduces,
    isAdmin,
    loadConduceImage
  } = useOptimizedEntregasDataFast();

  const { renderStatusBadge } = useStatusBadgeRenderer();
  const { entregarConduce, devolverConduce, clientes, setRegionActual } = useData();
  const { handleSaveLocation, savingLocation } = useSaveLocation(clientes, handleRefreshData);

  // Calculate cliente bultos stats from all user conduces
  const clienteBultosStats = useClienteBultosStats(userConduces);

  const {
    showDeliveryDialog,
    setShowDeliveryDialog,
    showReturnDialog,
    setShowReturnDialog,
    selectedConduce,
    setSelectedConduce,
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
    [...pendingDeliveries, ...completedDeliveries, ...returnedDeliveries]
  );

  const openGoogleMaps = (ubicacion: string | undefined) => {
    if (ubicacion) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`, '_blank');
    }
  };

  // Enhanced filtering function - only apply city filter to pending deliveries
  const filterConduces = (conduces: typeof pendingDeliveries, isPending: boolean = false) => {
    let filtered = conduces;
    
    // Apply search term filter to all types
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conduce =>
        conduce.numeroConduce.toLowerCase().includes(term) ||
        conduce.razonSocial?.toLowerCase().includes(term) ||
        conduce.numeroCliente.toLowerCase().includes(term) ||
        conduce.ciudad?.toLowerCase().includes(term) ||
        conduce.encomendado?.toLowerCase().includes(term)
      );
    }
    
    // Apply city filter ONLY to pending deliveries
    if (selectedCity && isPending) {
      filtered = filtered.filter(conduce => conduce.ciudad === selectedCity);
    }
    
    // Apply lab filter to all types
    if (selectedLab) {
      filtered = filtered.filter(conduce => conduce.laboratorio === selectedLab);
    }
    
    return filtered;
  };

  const filteredPending = useMemo(() => filterConduces(pendingDeliveries, true), [pendingDeliveries, searchTerm, selectedCity, selectedLab]);
  const filteredCompleted = useMemo(() => filterConduces(completedDeliveries, false), [completedDeliveries, searchTerm, selectedLab]);
  const filteredReturned = useMemo(() => filterConduces(returnedDeliveries, false), [returnedDeliveries, searchTerm, selectedLab]);
  
  const totalFilteredResults = filteredPending.length + filteredCompleted.length + filteredReturned.length;
  
  // Get cities only from pending deliveries for filter options
  const allConduces = useMemo(() => pendingDeliveries, [pendingDeliveries]);

  const handleClearFilters = () => {
    setSelectedCity('');
    setSelectedLab('');
    setSearchTerm('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasCamion) {
    return <NoCamionAssigned />;
  }

  return (
    <>
      <EntregasLayout
        loading={loading && isSubmitting}
        header={
          <EntregasHeader 
            regionActual={regionActual}
            onRefresh={handleRefreshData}
            onAutoDelivery={() => setShowAutoDeliveryDialog(true)}
            onEntregaLAM={() => setShowEntregaLAMDialog(true)}
            loading={loading}
            isAdmin={isAdmin}
            onRegionChange={(region) => {
              if (setRegionActual) {
                setRegionActual(region as any);
                setTimeout(() => handleRefreshData(), 100);
              }
            }}
          />
        }
        alerts={
          <PendingScansAlert userConduces={userConduces} />
        }
        stats={
          <EntregasStatsGrid
            stats={stats}
            pendingDeliveries={pendingDeliveries}
            isAdmin={isAdmin}
          />
        }
        search={
          <EntregasSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearSearch={() => setSearchTerm('')}
            totalResults={(searchTerm || selectedCity || selectedLab) ? totalFilteredResults : undefined}
            isFiltered={!!(searchTerm || selectedCity || selectedLab)}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedLab={selectedLab}
            onLabChange={setSelectedLab}
            onClearFilters={handleClearFilters}
            allConduces={allConduces}
          />
        }
        content={
          <EntregasTabsContent
            filteredPending={filteredPending}
            filteredCompleted={filteredCompleted}
            filteredReturned={filteredReturned}
            handleDeliverySelection={handleDeliverySelection}
            handleReturnSelection={handleReturnSelection}
            openGoogleMaps={openGoogleMaps}
            showDetails={showDetails}
            renderStatusBadge={renderStatusBadge}
            isSubmitting={isSubmitting}
            clienteBultosStats={clienteBultosStats}
            isAdmin={isAdmin}
          />
        }
      />

      {/* Dialogs */}
      <DeliveryDialog
        conduce={selectedConduce}
        open={showDeliveryDialog}
        onOpenChange={setShowDeliveryDialog}
        onSubmit={async (signature: string, note: string, image: string) => {
          if (selectedConduce) {
            await handleDeliverySubmit(
              selectedConduce,
              signature,
              note,
              image,
              () => setShowDeliveryDialog(false)
            );
          }
        }}
        onSaveLocation={handleSaveLocation}
        openGoogleMaps={openGoogleMaps}
        isSubmitting={isSubmitting}
        savingLocation={savingLocation}
        additionalConduces={additionalConduces}
      />

      <ReturnDialog
        conduce={selectedConduce}
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        onSubmit={async (note: string) => {
          if (selectedConduce) {
            await handleReturnSubmit(
              selectedConduce,
              note,
              () => setShowReturnDialog(false)
            );
          }
        }}
        isSubmitting={isSubmitting}
      />

      <AutoDeliveryDialog
        open={showAutoDeliveryDialog}
        onOpenChange={setShowAutoDeliveryDialog}
        onDeliveryComplete={handleRefreshData}
      />

      <EntregaLAMDialog
        open={showEntregaLAMDialog}
        onOpenChange={setShowEntregaLAMDialog}
        onSuccess={handleRefreshData}
      />
    </>
  );
};
