
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
import CargarCamionesLoadingScreen from '@/components/cargar-camiones/CargarCamionesLoadingScreen';
import { getTrucksByRegion } from '@/utils/trucksByRegion';

const CargarCamiones = () => {
  const { user } = useAuth();
  const { relaciones } = useRelaciones();
  const [selectedRelacion, setSelectedRelacion] = useState<string>('');
  const [currentScanValue, setCurrentScanValue] = useState('');
  const [currentScanType, setCurrentScanType] = useState<'conduce' | 'bulto'>('conduce');
  const [regionActual, setRegionActual] = useState<Region | string>('Norte');

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
    if (!regionActual || regionActual === 'Todas') return conduces;
    return conduces.filter(c => c.region === regionActual);
  }, [conduces, regionActual]);

  // Filter verified shipments by region
  const filteredVerifiedShipments = useMemo(() => {
    if (!regionActual || regionActual === 'Todas') return verifiedShipments;

    const validTrucks = new Set(getTrucksByRegion(regionActual));
    const conduceRegionMap = new Map<string, string>();
    conduces.forEach(c => {
      if (c.numeroConduce && c.region) {
        conduceRegionMap.set(c.numeroConduce, c.region);
      }
    });

    return verifiedShipments.filter(shipment => {
      const region = conduceRegionMap.get(shipment.conduce_number) || shipment.region || (shipment as any).conduces?.region;
      if (region) {
        return region === regionActual;
      }
      if (shipment.encomendado && shipment.encomendado !== 'Almacen') {
        return validTrucks.has(shipment.encomendado);
      }
      return false;
    });
  }, [verifiedShipments, conduces, regionActual]);

  // Compute scanned state for the filtered region
  const { filteredScannedConduces, filteredScannedBultos, filteredScannedBultoIds } = useMemo(() => {
    const scConduces: Record<string, string[]> = {};
    const scBultos: Record<string, number> = {};
    const scBultoIds: Record<string, string[]> = {};

    filteredVerifiedShipments.forEach(item => {
      const { encomendado, conduce_number, scan_type } = item;
      if (!encomendado) return;

      if (!scConduces[encomendado]) scConduces[encomendado] = [];
      if (!scBultos[encomendado]) scBultos[encomendado] = 0;
      if (!scBultoIds[encomendado]) scBultoIds[encomendado] = [];

      if (scan_type === 'conduce' && !scConduces[encomendado].includes(conduce_number)) {
        scConduces[encomendado] = [...scConduces[encomendado], conduce_number];
      }

      if (scan_type === 'bulto') {
        scBultos[encomendado]++;
        const bultoId = `${conduce_number}-${item.bulto_sequence || 1}`;
        scBultoIds[encomendado] = [...scBultoIds[encomendado], bultoId];
      }
    });

    return {
      filteredScannedConduces: scConduces,
      filteredScannedBultos: scBultos,
      filteredScannedBultoIds: scBultoIds
    };
  }, [filteredVerifiedShipments]);

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

  if (loading) {
    return (
      <Layout>
        <CargarCamionesLoadingScreen message="Cargando Carga de Camiones" />
      </Layout>
    );
  }

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
          conduces={conduces}
        />

        <LabBultosStats conduces={filteredConduces} loading={loading} />
        
        <CargarCamionesContent
          conduces={filteredConduces}
          loading={loading}
          scannedConduces={filteredScannedConduces}
          scannedBultos={filteredScannedBultos}
          scannedBultoIds={filteredScannedBultoIds}
          verifiedShipments={filteredVerifiedShipments}
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
