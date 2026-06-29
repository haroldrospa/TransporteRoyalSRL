import { useState, useEffect, useCallback, useRef } from 'react';
import { Conduce } from '@/types/conduces';
import { 
  getCargarCamionesDataWithCache,
  fetchCargarCamionesConduces,
  fetchVerifiedShipments,
  clearCargarCamionesCache,
  saveShipmentInBackground,
  waitForPendingSaves,
  deleteVerifiedShipment,
  clearAllVerifiedShipments,
  type VerifiedShipment
} from '@/services/cargarCamiones/fastCargarCamionesService';
import { getUserInfo, type CurrentUser } from '@/hooks/cargar-camiones/utils/user-info-utils';
import { updateConduceRelation, saveConduceRelation } from '@/services/conduces/relationOperations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  saveConducesOffline,
  saveShipmentsOffline,
  getConducesOffline,
  getShipmentsOffline,
  addPendingScan,
  getPendingScans,
  hasOfflineData,
} from '@/services/offline/offlineStorageService';
import { syncPendingScans, getPendingScanCount } from '@/services/offline/syncService';

export const useFastCargarCamiones = (currentUser?: CurrentUser | null) => {
  const [conduces, setConduces] = useState<Conduce[]>([]);
  const [verifiedShipments, setVerifiedShipments] = useState<VerifiedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Network status
  const { isOnline, wasOffline } = useNetworkStatus();
  
  // State for last scanned item (persistent display)
  const [lastScannedInfo, setLastScannedInfo] = useState<{
    conduceNumber: string;
    scanType: 'conduce' | 'bulto';
    encomendado: string;
    notFound?: boolean;
    duplicate?: boolean;
    delivered?: boolean;
    unassigned?: boolean;
    offline?: boolean; // New: indicates scan was saved offline
    timestamp: number;
  } | null>(null);
  
  // Local state for real-time updates
  const [scannedConduces, setScannedConduces] = useState<Record<string, string[]>>({});
  const [scannedBultos, setScannedBultos] = useState<Record<string, number>>({});
  const [scannedBultoIds, setScannedBultoIds] = useState<Record<string, string[]>>({});

  // Refs to avoid stale closures on very fast consecutive scans
  const scannedConducesRef = useRef<Record<string, string[]>>({});
  const scannedBultoIdsRef = useRef<Record<string, string[]>>({});
  const scannedBultosByConduceRef = useRef<Record<string, number>>({});

  // Keep refs synced with state
  useEffect(() => {
    scannedConducesRef.current = scannedConduces;
  }, [scannedConduces]);

  useEffect(() => {
    scannedBultoIdsRef.current = scannedBultoIds;
  }, [scannedBultoIds]);
  
  console.log('📊 [useFastCargarCamiones] Conduces:', conduces.length, 'Shipments:', verifiedShipments.length, 'Online:', isOnline);
  
  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingScanCount();
    setPendingSyncCount(count);
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('🌐 Back online! Starting sync...');
      syncOfflineData();
    }
  }, [isOnline, wasOffline]);

  // Update pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Sync offline data
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncPendingScans();
      if (result.synced > 0) {
        // Refresh data after sync
        await refreshData(false);
      }
      await updatePendingCount();
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Process shipments into local state
  const processShipments = useCallback((shipments: VerifiedShipment[]) => {
    const conduces: Record<string, string[]> = {};
    const bultos: Record<string, number> = {};
    const bultoIds: Record<string, string[]> = {};
    const bultosByConduce: Record<string, number> = {};
    
    shipments.forEach(item => {
      const { encomendado, conduce_number, scan_type } = item;
      
      if (!conduces[encomendado]) conduces[encomendado] = [];
      if (!bultos[encomendado]) bultos[encomendado] = 0;
      if (!bultoIds[encomendado]) bultoIds[encomendado] = [];
      
      if (scan_type === 'conduce' && !conduces[encomendado].includes(conduce_number)) {
        conduces[encomendado] = [...conduces[encomendado], conduce_number];
      }
      
      if (scan_type === 'bulto') {
        bultos[encomendado]++;
        const bultoId = `${conduce_number}-${item.bulto_sequence}`;
        bultoIds[encomendado] = [...bultoIds[encomendado], bultoId];
        bultosByConduce[conduce_number] = (bultosByConduce[conduce_number] || 0) + 1;
      }
    });
    
    setScannedConduces(conduces);
    setScannedBultos(bultos);
    setScannedBultoIds(bultoIds);

    scannedConducesRef.current = conduces;
    scannedBultoIdsRef.current = bultoIds;
    scannedBultosByConduceRef.current = bultosByConduce;
  }, []);
  
  // Load initial data - with offline fallback
  const loadInitialData = useCallback(async () => {
    console.log('🔄 [useFastCargarCamiones] Loading initial data... Online:', isOnline);
    setLoading(true);
    
    try {
      if (isOnline) {
        // Online: fetch fresh data
        console.log('🌐 Fetching fresh data from server...');
        clearCargarCamionesCache();
        
        const [freshConduces, freshShipments] = await Promise.all([
          fetchCargarCamionesConduces(),
          fetchVerifiedShipments()
        ]);
        
        console.log(`✅ Fresh data loaded: ${freshConduces.length} conduces, ${freshShipments.length} shipments`);
        
        setConduces(freshConduces);
        setVerifiedShipments(freshShipments);
        processShipments(freshShipments);
        
        // Save to offline storage for future use
        await Promise.all([
          saveConducesOffline(freshConduces),
          saveShipmentsOffline(freshShipments)
        ]);
        
        // Sync any pending offline scans
        if (await hasOfflineData()) {
          syncOfflineData();
        }
      } else {
        // Offline: load from IndexedDB
        console.log('📴 Loading from offline storage...');
        
        const [offlineConduces, offlineShipments] = await Promise.all([
          getConducesOffline(),
          getShipmentsOffline()
        ]);
        
        if (offlineConduces.length > 0) {
          console.log(`✅ Offline data loaded: ${offlineConduces.length} conduces, ${offlineShipments.length} shipments`);
          setConduces(offlineConduces);
          setVerifiedShipments(offlineShipments);
          processShipments(offlineShipments);
          
          toast({
            title: "Modo Offline",
            description: `Usando ${offlineConduces.length} conduces guardados localmente`,
          });
        } else {
          console.warn('⚠️ No offline data available');
          toast({
            title: "Sin conexión",
            description: "No hay datos guardados para modo offline. Conecta a internet para cargar datos.",
            variant: "destructive"
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      
      // Try offline fallback even if online fetch fails
      if (isOnline) {
        console.log('🔄 Trying offline fallback...');
        try {
          const [offlineConduces, offlineShipments] = await Promise.all([
            getConducesOffline(),
            getShipmentsOffline()
          ]);
          
          if (offlineConduces.length > 0) {
            setConduces(offlineConduces);
            setVerifiedShipments(offlineShipments);
            processShipments(offlineShipments);
            toast({
              title: "Usando datos offline",
              description: "Error de conexión. Usando datos guardados localmente.",
            });
          }
        } catch (offlineError) {
          console.error('❌ Offline fallback failed:', offlineError);
        }
      }
      
      setLoading(false);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    }
  }, [isOnline, processShipments, syncOfflineData]);
  
  // Manual refresh
  const refreshData = useCallback(async (showToast = true) => {
    if (!isOnline) {
      if (showToast) {
        toast({
          title: "Sin conexión",
          description: "No se pueden actualizar los datos sin conexión a internet",
          variant: "destructive"
        });
      }
      return;
    }
    
    console.log('🔄 [useFastCargarCamiones] Manual refresh...');
    setRefreshing(true);
    
    try {
      await waitForPendingSaves();
      clearCargarCamionesCache();
      
      const [freshConduces, freshShipments] = await Promise.all([
        fetchCargarCamionesConduces(),
        fetchVerifiedShipments()
      ]);
      
      setConduces(freshConduces);
      setVerifiedShipments(freshShipments);
      processShipments(freshShipments);
      
      // Update offline storage
      await Promise.all([
        saveConducesOffline(freshConduces),
        saveShipmentsOffline(freshShipments)
      ]);
      
      if (showToast) {
        toast({
          title: "Datos actualizados",
          description: `${freshConduces.length} conduces, ${freshShipments.length} escaneos`,
        });
      }
      
      console.log('✅ Manual refresh complete');
    } catch (error) {
      console.error('❌ Error refreshing:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los datos",
          variant: "destructive"
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, processShipments]);
  
  const [lastScannedConduce, setLastScannedConduce] = useState<{conduceNumber: string, timestamp: number} | null>(null);
  
  // Scan conduce - with offline support
  const handleScanConduce = useCallback(async (
    encomendado: string, 
    conduceNumber: string,
    selectedRelacion?: string
  ) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔄 handleScanConduce called:', { encomendado, conduceNumber, isOnline });
    
    try {
      const conduce = conduces.find(c => c.numeroConduce === conduceNumber);

      const isBultosCompleteForConduce = async (opts: {
        totalBultos: number;
        encomendadoKey?: string;
      }): Promise<{ complete: boolean; effectiveCount: number }> => {
        const totalBultos = opts.totalBultos || 0;
        if (totalBultos <= 0) return { complete: false, effectiveCount: 0 };

        const localCountByConduce = scannedBultosByConduceRef.current[conduceNumber] || 0;
        if (localCountByConduce >= totalBultos) {
          return { complete: true, effectiveCount: localCountByConduce };
        }

        const localIds = opts.encomendadoKey
          ? (scannedBultoIdsRef.current[opts.encomendadoKey] || [])
          : [];
        const localCountFromIds = localIds.filter((id) => id.startsWith(`${conduceNumber}-`)).length;
        const localCount = Math.max(localCountByConduce, localCountFromIds);

        if (localCount >= totalBultos) {
          return { complete: true, effectiveCount: localCount };
        }

        // Skip DB check if offline
        if (!isOnline) {
          return { complete: localCount >= totalBultos, effectiveCount: localCount };
        }

        const { count, error } = await supabase
          .from('verified_shipments')
          .select('id', { count: 'exact', head: true })
          .eq('conduce_number', conduceNumber)
          .eq('scan_type', 'bulto');

        if (error) {
          return { complete: localCount >= totalBultos, effectiveCount: localCount };
        }

        const dbCount = count || 0;
        const effective = Math.max(localCount, dbCount);
        return { complete: effective >= totalBultos, effectiveCount: effective };
      };
      
      if (!conduce) {
        // Offline: conduce not found locally
        if (!isOnline) {
          setLastScannedInfo({
            conduceNumber,
            scanType: 'conduce',
            encomendado: '',
            notFound: true,
            offline: true,
            timestamp: Date.now(),
          });
          setIsProcessing(false);
          return;
        }

        console.log('❌ Conduce not found in local list. Checking conduces table...');

        const { data: conduceAny } = await supabase
          .from('conduces')
          .select('numero_conduce, encomendado, cantidad_bultos, fecha_carga')
          .eq('numero_conduce', conduceNumber)
          .order('fecha_carga', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conduceAny) {
          const actualEncomendado = conduceAny.encomendado || '';
          const totalBultos = conduceAny.cantidad_bultos || 0;

          const alreadyScannedLocallyAny = Object.values(scannedConducesRef.current).some(
            (conducesList) => conducesList.includes(conduceNumber)
          );

          const { data: existingConduceScanAny } = await supabase
            .from('verified_shipments')
            .select('encomendado, verified_at')
            .eq('conduce_number', conduceNumber)
            .eq('scan_type', 'conduce')
            .order('verified_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const conduceAlreadyScanned = alreadyScannedLocallyAny || !!existingConduceScanAny;
          const { complete } = await isBultosCompleteForConduce({
            totalBultos,
            encomendadoKey: actualEncomendado || undefined,
          });

          setLastScannedInfo({
            conduceNumber,
            scanType: 'conduce',
            encomendado: (existingConduceScanAny?.encomendado || actualEncomendado) as string,
            duplicate: conduceAlreadyScanned && complete,
            notFound: false,
            delivered: false,
            unassigned: false,
            timestamp: Date.now(),
          });
        } else {
          console.log('❌ Conduce not found anywhere');
          setLastScannedInfo({
            conduceNumber,
            scanType: 'conduce',
            encomendado: '',
            notFound: true,
            duplicate: false,
            timestamp: Date.now(),
          });
        }
        
        setIsProcessing(false);
        return;
      }
      
      // If conduce is found but has no encomendado locally, check DB for updated value
      let actualEncomendado = conduce.encomendado || '';
      
      if (!actualEncomendado && isOnline) {
        console.log('📦 Conduce found locally without encomendado, checking DB...');
        const { data: freshConduce, error: freshError } = await supabase
          .from('conduces')
          .select('encomendado, fecha_carga')
          .eq('numero_conduce', conduceNumber)
          .order('fecha_carga', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (freshError) {
          console.warn('⚠️ Error fetching updated encomendado:', freshError);
        }
        
        if (freshConduce?.encomendado) {
          actualEncomendado = freshConduce.encomendado;
          console.log('📦 Found updated encomendado from DB:', actualEncomendado);
        }
      }
      
      // Set to "No asignado" only if still empty after DB check
      if (!actualEncomendado) {
        actualEncomendado = 'No asignado';
      }
      
      console.log('📦 Conduce found, encomendado:', actualEncomendado);

      const { complete: isBultosComplete } = await isBultosCompleteForConduce({
        totalBultos: conduce.cantidadBultos,
        encomendadoKey: actualEncomendado !== 'No asignado' ? actualEncomendado : undefined,
      });
      
      const now = Date.now();
      const isImmediateDuplicate = lastScannedConduce && 
        lastScannedConduce.conduceNumber === conduceNumber && 
        (now - lastScannedConduce.timestamp) < 10000;
      
      if (isImmediateDuplicate) {
        console.log('⚠️ IMMEDIATE DUPLICATE CONDUCE');
        setLastScannedInfo({
          conduceNumber,
          scanType: 'conduce',
          encomendado: actualEncomendado,
          duplicate: isBultosComplete,
          notFound: false,
          timestamp: now
        });
        
        setIsProcessing(false);
        return;
      }
      
      const alreadyScannedLocally = Object.values(scannedConducesRef.current).some(conducesList => 
        conducesList.includes(conduceNumber)
      );
      
      // Check database only if online
      let existingConduceScan = null;
      if (isOnline) {
        const { data } = await supabase
          .from('verified_shipments')
          .select('encomendado, verified_at')
          .eq('conduce_number', conduceNumber)
          .eq('scan_type', 'conduce')
          .order('verified_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        existingConduceScan = data;
      }
      
      const conduceAlreadyScanned = alreadyScannedLocally || !!existingConduceScan;

      if (conduceAlreadyScanned && isBultosComplete) {
        setLastScannedInfo({
          conduceNumber,
          scanType: 'conduce',
          encomendado: (existingConduceScan?.encomendado || actualEncomendado) as string,
          duplicate: true,
          notFound: false,
          timestamp: Date.now(),
        });
        setIsProcessing(false);
        return;
      }

      if (conduceAlreadyScanned) {
        const encomendadoToShow = existingConduceScan?.encomendado || actualEncomendado;
        setLastScannedInfo({
          conduceNumber,
          scanType: 'conduce',
          encomendado: encomendadoToShow,
          duplicate: false,
          notFound: false,
          timestamp: Date.now(),
        });
        setIsProcessing(false);
        return;
      }
      
      console.log('✅ New scan - showing green display');
      
      setLastScannedConduce({ conduceNumber, timestamp: now });
      
      // Show success with offline indicator if needed
      setLastScannedInfo({
        conduceNumber,
        scanType: 'conduce',
        encomendado: actualEncomendado,
        notFound: false,
        duplicate: false,
        offline: !isOnline,
        timestamp: Date.now()
      });
      
      const { user_id, user_name } = getUserInfo(currentUser);
      
      // Optimistic update
      setScannedConduces(prev => {
        const updated = {
          ...prev,
          [actualEncomendado]: [...(prev[actualEncomendado] || []), conduceNumber]
        };
        scannedConducesRef.current = updated;
        return updated;
      });
      
      if (isOnline) {
        // Online: save directly
        saveShipmentInBackground({
          conduce_id: conduce.id || null,
          conduce_number: conduceNumber,
          encomendado: actualEncomendado,
          scan_type: 'conduce',
          user_id,
          user_name
        });
        
        if (selectedRelacion && !conduce.relacion) {
          updateConduceRelation(conduceNumber, selectedRelacion).catch(err => 
            console.warn('Error updating relation:', err)
          );
          saveConduceRelation(conduceNumber, selectedRelacion, user_id).catch(err =>
            console.warn('Error saving relation:', err)
          );
        }
      } else {
        // Offline: save to pending queue
        console.log('📴 Saving scan offline:', conduceNumber);
        await addPendingScan({
          conduce_id: conduce.id || null,
          conduce_number: conduceNumber,
          encomendado: actualEncomendado,
          scan_type: 'conduce',
          user_id,
          user_name
        });
        await updatePendingCount();
        
        toast({
          title: "Guardado offline",
          description: `El escaneo se sincronizará cuando haya conexión`,
        });
      }
      
    } catch (error) {
      console.error('❌ Error scanning conduce:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [conduces, currentUser, isProcessing, isOnline, lastScannedConduce, updatePendingCount]);
  
  const handleNotFound = useCallback((scanValue: string, scanType: 'conduce' | 'bulto') => {
    setLastScannedInfo({
      conduceNumber: scanValue,
      scanType,
      encomendado: '',
      notFound: true,
      timestamp: Date.now()
    });
  }, []);
  
  const [lastScannedBulto, setLastScannedBulto] = useState<{conduceNumber: string, timestamp: number} | null>(null);
  
  // Scan bulto - with offline support
  const handleScanBulto = useCallback(async (
    encomendado: string,
    bultoId: string,
    conduceNumber: string
  ) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('🔄 handleScanBulto called:', { encomendado, bultoId, conduceNumber, isOnline });
    
    try {
      const conduce = conduces.find(c => c.numeroConduce === conduceNumber);
      
      if (!conduce) {
        if (!isOnline) {
          setLastScannedInfo({
            conduceNumber: bultoId,
            scanType: 'bulto',
            encomendado: '',
            notFound: true,
            offline: true,
            timestamp: Date.now(),
          });
          setIsProcessing(false);
          return;
        }

        console.log('❌ Conduce not found for bulto in local list. Checking DB...');

        const { data: conduceAny } = await supabase
          .from('conduces')
          .select('id, numero_conduce, encomendado, cantidad_bultos, fecha_carga')
          .eq('numero_conduce', conduceNumber)
          .order('fecha_carga', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conduceAny) {
          const actualEncomendado = conduceAny.encomendado || 'No asignado';
          const totalBultos = conduceAny.cantidad_bultos || 0;

          const rawBultoId = bultoId;
          const lastPart = rawBultoId.split('-').pop() || '';
          const hasExplicitSequence = rawBultoId.includes('-') && /^\d+$/.test(lastPart);

          const allLocalBultoIds = Object.values(scannedBultoIdsRef.current).flat();
          const localCountFromIds = allLocalBultoIds.filter((id) => id.startsWith(`${conduceNumber}-`)).length;
          const localCountFromRef = scannedBultosByConduceRef.current[conduceNumber] || 0;

          const { count: dbBultoCountRaw } = await supabase
            .from('verified_shipments')
            .select('id', { count: 'exact', head: true })
            .eq('conduce_number', conduceNumber)
            .eq('scan_type', 'bulto');
          const dbBultoCount = dbBultoCountRaw || 0;

          const effectiveCountForConduce = Math.max(localCountFromIds, localCountFromRef, dbBultoCount);
          const allBultosCompletePreScan = totalBultos > 0 && effectiveCountForConduce >= totalBultos;

          if (!hasExplicitSequence && allBultosCompletePreScan) {
            setLastScannedInfo({
              conduceNumber: rawBultoId,
              scanType: 'bulto',
              encomendado: actualEncomendado,
              duplicate: true,
              notFound: false,
              unassigned: true,
              timestamp: Date.now(),
            });
            setIsProcessing(false);
            return;
          }

          const parsedSequence = hasExplicitSequence ? parseInt(lastPart, 10) : undefined;
          const nextSequence = parsedSequence ?? (effectiveCountForConduce + 1);
          const bultoSequence = totalBultos > 0 ? Math.min(nextSequence, totalBultos) : nextSequence;

          const effectiveBultoId = hasExplicitSequence ? rawBultoId : `${conduceNumber}-${bultoSequence}`;

          const alreadyScannedLocally = allLocalBultoIds.includes(effectiveBultoId);

          const { data: existingBultoScan } = await supabase
            .from('verified_shipments')
            .select('id, encomendado, verified_at, bulto_sequence')
            .eq('conduce_number', conduceNumber)
            .eq('scan_type', 'bulto')
            .eq('bulto_sequence', bultoSequence)
            .order('verified_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const bultoAlreadyScanned = alreadyScannedLocally || !!existingBultoScan;
          const allBultosComplete = totalBultos > 0 && effectiveCountForConduce >= totalBultos;

          if (bultoAlreadyScanned && allBultosComplete) {
            setLastScannedInfo({
              conduceNumber: bultoId,
              scanType: 'bulto',
              encomendado: actualEncomendado,
              duplicate: true,
              notFound: false,
              delivered: false,
              unassigned: true,
              timestamp: Date.now(),
            });
            setIsProcessing(false);
            return;
          }

          if (bultoAlreadyScanned) {
            setLastScannedInfo({
              conduceNumber: bultoId,
              scanType: 'bulto',
              encomendado: actualEncomendado,
              duplicate: false,
              notFound: false,
              unassigned: true,
              timestamp: Date.now(),
            });
            setIsProcessing(false);
            return;
          }

          // New scan for conduce not in transit
          setLastScannedInfo({
            conduceNumber: bultoId,
            scanType: 'bulto',
            encomendado: actualEncomendado,
            notFound: false,
            duplicate: false,
            unassigned: true,
            timestamp: Date.now(),
          });

          const { user_id, user_name } = getUserInfo(currentUser);

          setScannedBultos(prev => ({
            ...prev,
            [actualEncomendado]: (prev[actualEncomendado] || 0) + 1
          }));
          setScannedBultoIds(prev => {
            const updated = {
              ...prev,
              [actualEncomendado]: [...(prev[actualEncomendado] || []), effectiveBultoId]
            };
            scannedBultoIdsRef.current = updated;
            return updated;
          });
          scannedBultosByConduceRef.current[conduceNumber] = 
            (scannedBultosByConduceRef.current[conduceNumber] || 0) + 1;

          saveShipmentInBackground({
            conduce_id: conduceAny.id || null,
            conduce_number: conduceNumber,
            encomendado: actualEncomendado,
            scan_type: 'bulto',
            bulto_sequence: bultoSequence,
            user_id,
            user_name
          });

          setIsProcessing(false);
          return;
        }

        console.log('❌ Conduce not found anywhere');
        setLastScannedInfo({
          conduceNumber: bultoId,
          scanType: 'bulto',
          encomendado: '',
          notFound: true,
          duplicate: false,
          timestamp: Date.now(),
        });

        setIsProcessing(false);
        return;
      }
      
      // If conduce is found but has no encomendado locally, check DB for updated value
      let actualEncomendado = conduce.encomendado || '';
      
      if (!actualEncomendado && isOnline) {
        console.log('📦 Conduce found locally without encomendado for bulto, checking DB...');
        const { data: freshConduce, error: freshError } = await supabase
          .from('conduces')
          .select('encomendado, fecha_carga')
          .eq('numero_conduce', conduceNumber)
          .order('fecha_carga', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (freshError) {
          console.warn('⚠️ Error fetching updated encomendado (bulto):', freshError);
        }
        
        if (freshConduce?.encomendado) {
          actualEncomendado = freshConduce.encomendado;
          console.log('📦 Found updated encomendado from DB:', actualEncomendado);
        }
      }
      
      // Set to "No asignado" only if still empty after DB check
      if (!actualEncomendado) {
        actualEncomendado = 'No asignado';
      }
      
      const totalBultos = conduce.cantidadBultos || 0;
      console.log('📦 Conduce found for bulto:', { actualEncomendado, totalBultos });

      // Some bulto labels only contain the conduce number (no sequence).
      // In that case we auto-assign the next bulto_sequence so repeated scans count: 1,2,3...
      const rawBultoId = bultoId;
      const lastPart = rawBultoId.split('-').pop() || '';
      const hasExplicitSequence = rawBultoId.includes('-') && /^\d+$/.test(lastPart);

      const allLocalBultoIds = Object.values(scannedBultoIdsRef.current).flat();
      const localCountFromIds = allLocalBultoIds.filter((id) => id.startsWith(`${conduceNumber}-`)).length;
      const localCountFromRef = scannedBultosByConduceRef.current[conduceNumber] || 0;
      const localBultoCountForConduce = Math.max(localCountFromIds, localCountFromRef);

      let dbBultoCount = 0;
      if (isOnline) {
        const { count } = await supabase
          .from('verified_shipments')
          .select('id', { count: 'exact', head: true })
          .eq('conduce_number', conduceNumber)
          .eq('scan_type', 'bulto');
        dbBultoCount = count || 0;
      }

      const effectiveCountForConduce = Math.max(localBultoCountForConduce, dbBultoCount);
      const allBultosCompletePreScan = totalBultos > 0 && effectiveCountForConduce >= totalBultos;

      // If we're already complete and the barcode doesn't include a sequence, treat as duplicate
      if (!hasExplicitSequence && allBultosCompletePreScan) {
        setLastScannedInfo({
          conduceNumber: rawBultoId,
          scanType: 'bulto',
          encomendado: actualEncomendado,
          duplicate: true,
          notFound: false,
          timestamp: Date.now(),
        });
        setIsProcessing(false);
        return;
      }

      const parsedSequence = hasExplicitSequence ? parseInt(lastPart, 10) : undefined;
      const nextSequence = parsedSequence ?? (effectiveCountForConduce + 1);
      const bultoSequence = totalBultos > 0 ? Math.min(nextSequence, totalBultos) : nextSequence;

      const effectiveBultoId = hasExplicitSequence ? rawBultoId : `${conduceNumber}-${bultoSequence}`;

      // Check immediate duplicate (same effective id scanned twice fast)
      const now = Date.now();
      const isImmediateDuplicate = lastScannedBulto &&
        lastScannedBulto.conduceNumber === effectiveBultoId &&
        (now - lastScannedBulto.timestamp) < 10000;

      if (isImmediateDuplicate) {
        console.log('⚠️ IMMEDIATE DUPLICATE BULTO');
        setLastScannedInfo({
          conduceNumber: rawBultoId,
          scanType: 'bulto',
          encomendado: actualEncomendado,
          duplicate: allBultosCompletePreScan,
          notFound: false,
          timestamp: now
        });
        setIsProcessing(false);
        return;
      }

      // Local duplicate check
      const alreadyScannedLocally = allLocalBultoIds.includes(effectiveBultoId);

      // DB check only if online (for this sequence)
      let existingBultoScan = null;
      if (isOnline) {
        const { data } = await supabase
          .from('verified_shipments')
          .select('id, encomendado, verified_at, bulto_sequence')
          .eq('conduce_number', conduceNumber)
          .eq('scan_type', 'bulto')
          .eq('bulto_sequence', bultoSequence)
          .order('verified_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        existingBultoScan = data;
      }

      const bultoAlreadyScanned = alreadyScannedLocally || !!existingBultoScan;
      const effectiveBultoCount = Math.max(localBultoCountForConduce, dbBultoCount);
      const allBultosComplete = totalBultos > 0 && effectiveBultoCount >= totalBultos;

      if (bultoAlreadyScanned && allBultosComplete) {
        setLastScannedInfo({
          conduceNumber: bultoId,
          scanType: 'bulto',
          encomendado: (existingBultoScan?.encomendado || actualEncomendado) as string,
          duplicate: true,
          notFound: false,
          timestamp: Date.now(),
        });
        setIsProcessing(false);
        return;
      }

      if (bultoAlreadyScanned) {
        setLastScannedInfo({
          conduceNumber: bultoId,
          scanType: 'bulto',
          encomendado: existingBultoScan?.encomendado || actualEncomendado,
          duplicate: false,
          notFound: false,
          timestamp: Date.now(),
        });
        setIsProcessing(false);
        return;
      }

      console.log('✅ New bulto scan');
      setLastScannedBulto({ conduceNumber: effectiveBultoId, timestamp: now });

      setLastScannedInfo({
        conduceNumber: rawBultoId,
        scanType: 'bulto',
        encomendado: actualEncomendado,
        notFound: false,
        duplicate: false,
        offline: !isOnline,
        timestamp: Date.now()
      });

      const { user_id, user_name } = getUserInfo(currentUser);

      // Optimistic update
      setScannedBultos(prev => ({
        ...prev,
        [actualEncomendado]: (prev[actualEncomendado] || 0) + 1
      }));
      setScannedBultoIds(prev => {
        const updated = {
          ...prev,
          [actualEncomendado]: [...(prev[actualEncomendado] || []), effectiveBultoId]
        };
        scannedBultoIdsRef.current = updated;
        return updated;
      });
      scannedBultosByConduceRef.current[conduceNumber] = 
        (scannedBultosByConduceRef.current[conduceNumber] || 0) + 1;

      if (isOnline) {
        saveShipmentInBackground({
          conduce_id: conduce.id || null,
          conduce_number: conduceNumber,
          encomendado: actualEncomendado,
          scan_type: 'bulto',
          bulto_sequence: bultoSequence,
          user_id,
          user_name
        });
      } else {
        console.log('📴 Saving bulto scan offline:', bultoId);
        await addPendingScan({
          conduce_id: conduce.id || null,
          conduce_number: conduceNumber,
          encomendado: actualEncomendado,
          scan_type: 'bulto',
          bulto_sequence: bultoSequence,
          user_id,
          user_name
        });
        await updatePendingCount();

        toast({
          title: "Guardado offline",
          description: `El escaneo se sincronizará cuando haya conexión`,
        });
      }

    } catch (error) {
      console.error('❌ Error scanning bulto:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [conduces, currentUser, isProcessing, isOnline, lastScannedBulto, updatePendingCount]);

  // Delete shipment (conduce only)
  const deleteConduceShipment = useCallback(async (conduceNumber: string) => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede eliminar sin conexión a internet",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce');

      if (error) throw error;

      // Update local state
      setScannedConduces(prev => {
        const updated = { ...prev };
        for (const enc in updated) {
          updated[enc] = updated[enc].filter(c => c !== conduceNumber);
          if (updated[enc].length === 0) delete updated[enc];
        }
        scannedConducesRef.current = updated;
        return updated;
      });

      setVerifiedShipments(prev => 
        prev.filter(s => !(s.conduce_number === conduceNumber && s.scan_type === 'conduce'))
      );

      toast({
        title: "Conduce eliminado",
        description: `Se eliminó el conduce ${conduceNumber}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting conduce shipment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el conduce",
        variant: "destructive"
      });
      throw error;
    }
  }, [isOnline]);

  // Delete bulto shipment
  const deleteBultoShipment = useCallback(async (conduceNumber: string) => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede eliminar sin conexión a internet",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'bulto');

      if (error) throw error;

      // Refresh to get accurate counts
      await refreshData(false);

      toast({
        title: "Bultos eliminados",
        description: `Se eliminaron los bultos del conduce ${conduceNumber}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting bulto shipment:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los bultos",
        variant: "destructive"
      });
      throw error;
    }
  }, [isOnline, refreshData]);

  // Clear all conduces only
  const clearConducesOnly = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede limpiar sin conexión a internet",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('scan_type', 'conduce');

      if (error) throw error;

      setScannedConduces({});
      scannedConducesRef.current = {};
      setVerifiedShipments(prev => prev.filter(s => s.scan_type !== 'conduce'));

      toast({
        title: "Conduces eliminados",
        description: "Se eliminaron todos los conduces verificados",
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing conduces:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los conduces",
        variant: "destructive"
      });
      throw error;
    }
  }, [isOnline]);

  // Clear all bultos only
  const clearBultosOnly = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede limpiar sin conexión a internet",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('scan_type', 'bulto');

      if (error) throw error;

      setScannedBultos({});
      setScannedBultoIds({});
      scannedBultoIdsRef.current = {};
      scannedBultosByConduceRef.current = {};
      setVerifiedShipments(prev => prev.filter(s => s.scan_type !== 'bulto'));

      toast({
        title: "Bultos eliminados",
        description: "Se eliminaron todos los bultos verificados",
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing bultos:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los bultos",
        variant: "destructive"
      });
      throw error;
    }
  }, [isOnline]);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Real-time subscription (only when online)
  useEffect(() => {
    if (!isOnline) return;

    const channel = supabase
      .channel('verified-shipments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'verified_shipments'
        },
        () => {
          console.log('🔔 Real-time update received');
          // Debounce refresh
          setTimeout(() => refreshData(false), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, refreshData]);

  return {
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
    handleScanConduce,
    handleScanBulto,
    handleNotFound,
    deleteConduceShipment,
    deleteBultoShipment,
    clearConducesOnly,
    clearBultosOnly,
    // Offline specific
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncOfflineData,
  };
};
