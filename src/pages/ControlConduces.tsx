import { useState, useMemo, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useControlConduces } from '@/hooks/useControlConduces';
import { useAuth } from '@/contexts/AuthContext';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';
import ControlConducesHeader from '@/components/control-conduces/ControlConducesHeader';
import ControlConducesScanSection from '@/components/control-conduces/ControlConducesScanSection';
import ControlConducesRelacionesGrid from '@/components/control-conduces/ControlConducesRelacionesGrid';
import { Region } from '@/types/conduces';

const ControlConduces = () => {
  const { user } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [regionActual, setRegionActual] = useState<Region>('Norte');
  const { voiceEnabled, voiceSpeed, toggleVoice, updateVoiceSpeed, announceConduce } = useVoiceAnnouncement();
  const lastAnnouncedRef = useRef<string | null>(null);
  
  const {
    relacionesPorFecha,
    loading,
    refreshing,
    isProcessing,
    handleScanConduce,
    refreshData,
    scanResult
  } = useControlConduces(user);

  // Anunciar por voz cuando hay un nuevo resultado exitoso
  useEffect(() => {
    if (scanResult && !scanResult.error && scanResult.fechaCarga && scanResult.relacionNombre) {
      const resultKey = `${scanResult.conduceNumber}-${scanResult.fechaCarga}-${scanResult.relacionNombre}`;
      if (lastAnnouncedRef.current !== resultKey) {
        lastAnnouncedRef.current = resultKey;
        announceConduce(scanResult.fechaCarga, scanResult.relacionNombre);
      }
    }
  }, [scanResult, announceConduce]);

  // Filter relaciones by region
  const filteredRelacionesPorFecha = useMemo(() => {
    const filtered: typeof relacionesPorFecha = {};
    
    Object.entries(relacionesPorFecha).forEach(([fecha, relaciones]) => {
      const filteredRelaciones = relaciones.filter(rel => rel.region === regionActual);
      
      if (filteredRelaciones.length > 0) {
        filtered[fecha] = filteredRelaciones;
      }
    });
    
    return filtered;
  }, [relacionesPorFecha, regionActual]);

  const handleScan = async () => {
    if (!scanValue.trim()) return;
    await handleScanConduce(scanValue.trim());
    setScanValue('');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-8">
        <ControlConducesHeader 
          isRefreshing={loading || refreshing}
          onRefresh={() => refreshData(true)}
          regionActual={regionActual}
          onRegionChange={setRegionActual}
          voiceEnabled={voiceEnabled}
          voiceSpeed={voiceSpeed}
          onToggleVoice={toggleVoice}
          onVoiceSpeedChange={updateVoiceSpeed}
        />
        
      <ControlConducesScanSection
        scanValue={scanValue}
        setScanValue={setScanValue}
        onScan={handleScan}
        isProcessing={isProcessing}
        scanResult={scanResult}
      />

        <ControlConducesRelacionesGrid
          relacionesPorFecha={filteredRelacionesPorFecha}
          loading={loading || refreshing}
          onUpdate={() => refreshData(true)}
        />
      </div>
    </Layout>
  );
};

export default ControlConduces;
