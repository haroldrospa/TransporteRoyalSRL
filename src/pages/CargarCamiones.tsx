
import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import CargarCamionesHeader from '@/components/cargar-camiones/CargarCamionesHeader';
import CargarCamionesContent from '@/components/cargar-camiones/CargarCamionesContent';
import OfflineIndicator from '@/components/cargar-camiones/OfflineIndicator';
import { useFastCargarCamiones } from '@/hooks/useFastCargarCamiones';
import { useAuth } from '@/contexts/AuthContext';
import { useRelaciones } from '@/hooks/cargar-camiones/use-relaciones';
import { waitForPendingSaves } from '@/services/cargarCamiones/fastCargarCamionesService';
import { Region } from '@/types/conduces';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import LabBultosStats from '@/components/cargar-camiones/LabBultosStats';

const CargarCamiones = () => {
  const { user } = useAuth();
  const { relaciones } = useRelaciones();
  const [selectedRelacion, setSelectedRelacion] = useState<string>('');
  const [currentScanValue, setCurrentScanValue] = useState('');
  const [currentScanType, setCurrentScanType] = useState<'conduce' | 'bulto'>('conduce');
  const [regionActual, setRegionActual] = useState<Region>('Norte');

  // Pre-warm camera only if the browser already granted permission.
  // (Requesting permission automatically on page load is blocked on some browsers.)
  useEffect(() => {
    let cancelled = false;

    const warmupCameraIfGranted = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;

        const anyNavigator = navigator as any;
        if (!anyNavigator.permissions?.query) return;

        const status = await anyNavigator.permissions.query({ name: 'camera' });
        if (cancelled || status?.state !== 'granted') return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
    };

    warmupCameraIfGranted();

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    conduces,
    verifiedShipments,
    loading,
    refreshing,
    isProcessing,
    scannedConduces,
    scannedBultos,
    scannedBultoIds,
    lastScannedInfo,
    refreshData,
    handleScanConduce: scanConduce,
    handleScanBulto: scanBulto,
    handleNotFound,
    deleteConduceShipment,
    deleteBultoShipment,
    clearConducesOnly,
    clearBultosOnly,
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncOfflineData,
  } = useFastCargarCamiones(user);

  // Warn user before leaving if there are pending scans
  useBeforeUnload(
    pendingSyncCount > 0,
    `Tienes ${pendingSyncCount} escaneo${pendingSyncCount !== 1 ? 's' : ''} pendiente${pendingSyncCount !== 1 ? 's' : ''} de sincronizar. ¿Seguro que deseas salir?`
  );
  
  // Filter conduces by region
  const filteredConduces = useMemo(() => {
    return conduces.filter(c => c.region === regionActual);
  }, [conduces, regionActual]);

  // Use last scanned info for persistent display, or current input for immediate feedback
  const displayScanValue = lastScannedInfo?.conduceNumber || currentScanValue;
  const displayScanType = lastScannedInfo?.scanType || currentScanType;
  const displayEncomendado = lastScannedInfo?.encomendado;
  const displayNotFound = lastScannedInfo?.notFound || false;
  const displayDuplicate = lastScannedInfo?.duplicate || false;
  const displayDelivered = lastScannedInfo?.delivered || false;
  const displayUnassigned = lastScannedInfo?.unassigned || false;
  const duplicateEncomendado = lastScannedInfo?.duplicate ? lastScannedInfo.encomendado : undefined;
  
  // Scan handlers with selected relation
  const handleScanConduce = async (encomendado: string, conduceNumber: string) => {
    await scanConduce(encomendado, conduceNumber, selectedRelacion);
    setCurrentScanValue(''); // Clear input after scan
  };
  
  const handleScanBulto = async (encomendado: string, bultoId: string, conduceNumber: string) => {
    await scanBulto(encomendado, bultoId, conduceNumber);
    setCurrentScanValue(''); // Clear input after scan
  };
  
  const handleUpdateScanValue = (value: string, type: 'conduce' | 'bulto') => {
    setCurrentScanValue(value);
    setCurrentScanType(type);
  };
  
  const handleDeleteConduceShipment = async (conduceNumber: string) => {
    return await deleteConduceShipment(conduceNumber);
  };

  const handleDeleteBultoShipment = async (conduceNumber: string) => {
    return await deleteBultoShipment(conduceNumber);
  };
  
  const handleDeleteAllConduces = async () => {
    return await clearConducesOnly();
  };

  const handleDeleteAllBultos = async () => {
    return await clearBultosOnly();
  };
  
  const loadVerifiedShipments = async () => {
    await refreshData(false);
  };
  
  const exportToExcel = () => {
    // Dynamic import of export functionality
    import('@/hooks/shipment-verification/use-export-shipments')
      .then(module => {
        const { useExportShipments } = module;
        const exportHook = useExportShipments(verifiedShipments, conduces);
        exportHook.exportToExcel();
      })
      .catch(err => console.error('Error exporting:', err));
  };
  
  // Cleanup: wait for pending saves before unmount
  useEffect(() => {
    return () => {
      waitForPendingSaves();
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-[1600px] w-full mx-auto px-2 sm:px-6 space-y-6 animate-fade-in pb-8">
        <OfflineIndicator
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          isSyncing={isSyncing}
          onSync={syncOfflineData}
        />
        
        <CargarCamionesHeader 
          isRefreshing={loading || refreshing} 
          onRefresh={() => refreshData(true)}
          regionActual={regionActual}
          onRegionChange={setRegionActual}
        />

        <LabBultosStats conduces={filteredConduces} />
        
        <CargarCamionesContent
          conduces={filteredConduces}
          scannedConduces={scannedConduces}
          scannedBultos={scannedBultos}
          scannedBultoIds={scannedBultoIds}
          verifiedShipments={verifiedShipments}
          currentScanValue={currentScanValue}
          currentScanType={currentScanType}
          displayScanValue={displayScanValue}
          displayScanType={displayScanType}
          displayEncomendado={displayEncomendado}
          displayNotFound={displayNotFound}
          displayDuplicate={displayDuplicate}
          displayDelivered={displayDelivered}
          displayUnassigned={displayUnassigned}
          duplicateEncomendado={duplicateEncomendado}
          setCurrentScanValue={setCurrentScanValue}
          setCurrentScanType={setCurrentScanType}
          onScanConduce={handleScanConduce}
          onScanBulto={handleScanBulto}
          onNotFound={handleNotFound}
          onUpdateScanValue={handleUpdateScanValue}
          onDeleteConduceShipment={handleDeleteConduceShipment}
          onDeleteBultoShipment={handleDeleteBultoShipment}
          onDeleteAllConduces={handleDeleteAllConduces}
          onDeleteAllBultos={handleDeleteAllBultos}
          onExportShipments={exportToExcel}
          loadVerifiedShipments={loadVerifiedShipments}
          isProcessing={isProcessing}
          selectedRelacion={selectedRelacion}
          onRelacionChange={setSelectedRelacion}
        />
      </div>
    </Layout>
  );
};

export default CargarCamiones;
