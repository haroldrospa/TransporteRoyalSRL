import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useData } from '@/contexts/DataContext';
import { Region, Conduce } from '@/types/conduces';
import { getTrucksByRegion, getAllValidTrucks } from '@/utils/trucksByRegion';
import { MonitoreoHeaderStats } from '@/components/monitoreo/MonitoreoHeaderStats';
import { MonitoreoMapa } from '@/components/monitoreo/MonitoreoMapa';
import { TruckFleetPanel, TruckStatsItem } from '@/components/monitoreo/TruckFleetPanel';
import { calculateTrucksCurrentLocation, filterConducesParaMonitoreo } from '@/components/monitoreo/truckLocationUtils';
import { fetchUsers } from '@/services/api/userService';
import { Usuario } from '@/types/usuarios';
import { useToast } from '@/hooks/use-toast';
import { getTruckColor } from '@/components/monitoreo/truckColors';
import { normalizeTruckCode } from '@/utils/trucksByRegion';
import { supabase } from '@/integrations/supabase/client';
import { mapDbConduceToConduce } from '@/utils/mappers/conduceMappers';
import { Loader2 } from 'lucide-react';

const MONITOREO_CACHE_KEY = 'royal_monitoreo_active_cache';

const getInitialMonitoreoCache = (): Conduce[] => {
  try {
    const cached = localStorage.getItem(MONITOREO_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading monitoreo cache:', e);
  }
  return [];
};

const Monitoreo: React.FC = () => {
  const { conduces = [], regionActual, setRegionActual, getClienteByNumero, refreshData, loading } = useData();
  const { toast } = useToast();

  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [focusTruckName, setFocusTruckName] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'entregados' | 'devueltos'>('todos');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fastConduces, setFastConduces] = useState<Conduce[]>(getInitialMonitoreoCache);
  const [isFastFetching, setIsFastFetching] = useState<boolean>(false);

  // Fast fetch directo de Supabase para flota activa (~300ms) si no hay datos aún
  useEffect(() => {
    if (conduces.length === 0 && fastConduces.length === 0) {
      let isMounted = true;
      setIsFastFetching(true);

      const fetchActiveConduces = async () => {
        try {
          const { data, error } = await supabase
            .from('conduces')
            .select('*')
            .in('estado', ['En tránsito', 'Entregado', 'Devuelto'])
            .order('updated_at', { ascending: false })
            .limit(500);

          if (!error && data && data.length > 0 && isMounted) {
            const mapped = data.map(mapDbConduceToConduce);
            setFastConduces(mapped);
            try {
              localStorage.setItem(MONITOREO_CACHE_KEY, JSON.stringify(mapped));
            } catch (err) {
              // Ignore quota limit
            }
          }
        } catch (err) {
          console.warn('Error fetching fast active conduces:', err);
        } finally {
          if (isMounted) setIsFastFetching(false);
        }
      };

      fetchActiveConduces();
      return () => {
        isMounted = false;
      };
    }
  }, [conduces.length, fastConduces.length]);

  // Cargar lista de usuarios para asociar choferes a cada camión
  useEffect(() => {
    fetchUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.warn('Could not load users for driver mapping:', err));
  }, []);

  // Determinar los conduces efectivos: los globales de DataContext o el cache/fast fetch
  const effectiveConduces = useMemo(() => {
    if (conduces && conduces.length > 0) {
      return conduces;
    }
    return fastConduces;
  }, [conduces, fastConduces]);

  const isDataLoading = (loading && effectiveConduces.length === 0) || (isFastFetching && effectiveConduces.length === 0);

  // 1. Filtrar estrictamente: Solo bultos en ruta (en tránsito cargados en encomendados, NO almacén)
  //    y los entregados o devueltos el día de la ruta activa.
  const { filteredConduces, activeDates } = useMemo(() => {
    return filterConducesParaMonitoreo(effectiveConduces, regionActual);
  }, [effectiveConduces, regionActual]);

  // Persistir en cache activo cuando se filtran conduces reales
  useEffect(() => {
    if (filteredConduces.length > 0) {
      try {
        localStorage.setItem(MONITOREO_CACHE_KEY, JSON.stringify(filteredConduces.slice(0, 400)));
      } catch (err) {
        // Safe ignore
      }
    }
  }, [filteredConduces]);

  const activeDatesLabel = useMemo(() => {
    if (activeDates.length === 0) return undefined;
    return activeDates.join(', ');
  }, [activeDates]);

  // Obtener lista de camiones válidos para la región
  const validTruckNames = useMemo(() => {
    return regionActual === 'Todas' ? getAllValidTrucks() : getTrucksByRegion(regionActual);
  }, [regionActual]);

  // 2. Calcular ubicaciones actuales de los camiones
  const truckLocations = useMemo(() => {
    return calculateTrucksCurrentLocation(filteredConduces, getClienteByNumero, users);
  }, [filteredConduces, getClienteByNumero, users]);

  // 3. Calcular estadísticas detalladas por camión / encomendado
  const trucksStats = useMemo(() => {
    const map = new Map<string, {
      truckName: string;
      bultosPendientes: number;
      bultosEntregados: number;
      bultosDevueltos: number;
      conducesPendientes: number;
      conducesEntregados: number;
      conducesDevueltos: number;
      clientesSet: Set<string>;
    }>();

    validTruckNames
      .filter((t) => t !== 'Almacen')
      .forEach((truckName) => {
        const canonical = normalizeTruckCode(truckName);
        if (!map.has(canonical)) {
          map.set(canonical, {
            truckName: canonical,
            bultosPendientes: 0,
            bultosEntregados: 0,
            bultosDevueltos: 0,
            conducesPendientes: 0,
            conducesEntregados: 0,
            conducesDevueltos: 0,
            clientesSet: new Set()
          });
        }
      });

    filteredConduces.forEach((c) => {
      const rawEncom = (c.encomendado || '').trim();
      if (!rawEncom || rawEncom.toLowerCase().includes('almacen') || rawEncom.toLowerCase() === 'sin asignar') return;
      const encomendado = normalizeTruckCode(rawEncom);

      let entry = map.get(encomendado);
      if (!entry) {
        entry = {
          truckName: encomendado,
          bultosPendientes: 0,
          bultosEntregados: 0,
          bultosDevueltos: 0,
          conducesPendientes: 0,
          conducesEntregados: 0,
          conducesDevueltos: 0,
          clientesSet: new Set()
        };
        map.set(encomendado, entry);
      }

      const bultos = Number(c.cantidadBultos) || 1;
      const isDelivered = c.estado === 'Entregado';
      const isReturned = c.estado === 'Devuelto';
      const isPending = c.estado === 'En tránsito';

      if (isDelivered) {
        entry.bultosEntregados += Number(c.cantidadEntregados) || bultos;
        entry.conducesEntregados += 1;
      } else if (isReturned) {
        entry.bultosDevueltos += bultos;
        entry.conducesDevueltos += 1;
      } else if (isPending) {
        entry.bultosPendientes += bultos;
        entry.conducesPendientes += 1;
      }

      if (c.numeroCliente) {
        entry.clientesSet.add(c.numeroCliente);
      }
    });

    const result: TruckStatsItem[] = [];
    map.forEach((item) => {
      const totalBultos = item.bultosPendientes + item.bultosEntregados + item.bultosDevueltos;
      const totalConduces = item.conducesPendientes + item.conducesEntregados + item.conducesDevueltos;

      if (totalBultos > 0 || totalConduces > 0) {
        const percentEntregado = totalBultos > 0 ? Math.round((item.bultosEntregados / totalBultos) * 100) : 0;
        result.push({
          truckName: item.truckName,
          bultosPendientes: item.bultosPendientes,
          bultosEntregados: item.bultosEntregados,
          bultosDevueltos: item.bultosDevueltos,
          totalBultos,
          conducesPendientes: item.conducesPendientes,
          conducesEntregados: item.conducesEntregados,
          conducesDevueltos: item.conducesDevueltos,
          totalConduces,
          clientesCount: item.clientesSet.size,
          percentEntregado
        });
      }
    });

    return result.sort((a, b) => a.truckName.localeCompare(b.truckName));
  }, [filteredConduces, validTruckNames]);

  // 4. Totales globales para las tarjetas de cabecera
  const globalStats = useMemo(() => {
    let totalBultos = 0;
    let bultosEntregados = 0;
    let bultosPendientes = 0;
    let bultosDevueltos = 0;
    let conducesEntregados = 0;
    let conducesPendientes = 0;
    let conducesDevueltos = 0;

    trucksStats.forEach((t) => {
      totalBultos += t.totalBultos;
      bultosEntregados += t.bultosEntregados;
      bultosPendientes += t.bultosPendientes;
      bultosDevueltos += (t.bultosDevueltos || 0);
      conducesEntregados += t.conducesEntregados;
      conducesPendientes += t.conducesPendientes;
      conducesDevueltos += (t.conducesDevueltos || 0);
    });

    return {
      totalCamiones: trucksStats.length,
      totalBultos,
      bultosEntregados,
      bultosPendientes,
      bultosDevueltos,
      conducesEntregados,
      conducesPendientes,
      conducesDevueltos
    };
  }, [trucksStats]);

  // Manejar refresco manual
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData(true);
      toast({
        title: "Monitoreo actualizado",
        description: "Se han sincronizado las ubicaciones y entregas de la flota."
      });
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudieron refrescar los datos.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData, toast]);

  const handleFocusTruck = useCallback((truckName: string) => {
    setSelectedTruck(truckName);
    setFocusTruckName(truckName);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-3 space-y-3 max-w-[1600px]">
        {/* Cabecera con Colores TransporteRoyal y Estadísticas de la Ruta del Día */}
        <MonitoreoHeaderStats
          totalCamiones={globalStats.totalCamiones}
          totalBultos={globalStats.totalBultos}
          bultosEntregados={globalStats.bultosEntregados}
          bultosPendientes={globalStats.bultosPendientes}
          bultosDevueltos={globalStats.bultosDevueltos}
          conducesEntregados={globalStats.conducesEntregados}
          conducesPendientes={globalStats.conducesPendientes}
          conducesDevueltos={globalStats.conducesDevueltos}
          selectedRegion={regionActual}
          onRegionChange={setRegionActual}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          activeDatesLabel={activeDatesLabel}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isLoading={isDataLoading}
        />

        {/* Barra de Selección Rápida de Camiones (Chips Minimalistas) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {isDataLoading && trucksStats.length === 0 ? (
            <div className="flex items-center gap-2 py-0.5 animate-pulse">
              <div className="h-6 w-20 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-24 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-24 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-24 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedTruck(null)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedTruck === null
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                Todos ({trucksStats.length})
              </button>

              {trucksStats.map((truck) => {
                const isSelected = selectedTruck !== null && normalizeTruckCode(selectedTruck) === normalizeTruckCode(truck.truckName);
                const colors = getTruckColor(truck.truckName);

                return (
                  <button
                    key={truck.truckName}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTruck(null);
                      } else {
                        handleFocusTruck(truck.truckName);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.hex }}></span>
                    <span>{truck.truckName}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      {truck.bultosPendientes > 0 ? truck.bultosPendientes : '✓'}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Contenido Principal: Mapa Grande (70%) + Panel de Flota (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Mapa Grande (8 cols en lg, 9 cols en xl) */}
          <div className="lg:col-span-8 xl:col-span-9 w-full relative">
            {(isDataLoading || isRefreshing) && (
              <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 pointer-events-none animate-in fade-in duration-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-royal-blue" />
                <span>Sincronizando ruta...</span>
              </div>
            )}
            <MonitoreoMapa
              conduces={filteredConduces}
              getClienteByNumero={getClienteByNumero}
              selectedTruck={selectedTruck}
              statusFilter={statusFilter}
              focusTruckName={focusTruckName}
              truckLocations={truckLocations}
              onSelectTruck={setSelectedTruck}
            />
          </div>

          {/* Panel Lateral de Flota y Encomendados (4 cols en lg, 3 cols en xl) */}
          <div className="lg:col-span-4 xl:col-span-3 w-full">
            <TruckFleetPanel
              trucks={trucksStats}
              selectedTruck={selectedTruck}
              onSelectTruck={setSelectedTruck}
              onFocusTruck={handleFocusTruck}
              truckLocations={truckLocations}
              isLoading={isDataLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Monitoreo;
