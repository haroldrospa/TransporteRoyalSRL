import React, { memo, Suspense, lazy, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Conduce } from '@/types/conduces';
import { AlertTriangle, MapPin, Truck, Warehouse, Navigation, ArrowUpDown, RefreshCw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapaChoferEntregas } from './MapaChoferEntregas';
import { WarehouseDeliveriesSection } from './WarehouseDeliveriesSection';
import { useData } from '@/contexts/DataContext';
import { useConduceProximity } from '@/hooks/useConduceProximity';

// Lazy load table wrapper for better performance
const LazyEntregasTableWrapper = lazy(() => import('./EntregasTableWrapper').then(module => ({
  default: module.EntregasTableWrapper
})));

interface PendingOnlyTableProps {
  filteredPending: Conduce[];
  filteredWarehouse?: Conduce[];
  loadingWarehouse?: boolean;
  handleDeliverySelection: (conduce: Conduce) => void;
  handleReturnSelection: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  showDetails: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  isSubmitting: boolean;
  clienteBultosStats?: Record<string, {
    totalBultos: number;
    totalConduces: number;
  }>;
  isAdmin?: boolean;
  searchBar?: React.ReactNode;
  onUpdateRoute?: (conduceId: string, newRoute: string) => Promise<boolean>;
  onMoveToTruck?: (conduceId: string) => Promise<boolean>;
  userCamion?: string;
}

const TableSkeleton = memo(() => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
));
TableSkeleton.displayName = 'TableSkeleton';

export const PendingOnlyTable = memo(({
  filteredPending,
  filteredWarehouse = [],
  loadingWarehouse = false,
  handleDeliverySelection,
  handleReturnSelection,
  openGoogleMaps,
  showDetails,
  renderStatusBadge,
  isSubmitting,
  clienteBultosStats,
  isAdmin = false,
  searchBar,
  onUpdateRoute,
  onMoveToTruck,
  userCamion
}: PendingOnlyTableProps) => {
  const { getClienteByNumero } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'camion' | 'almacen'>('camion');

  // Proximidad GPS y ordenamiento por cercanía
  const {
    userLocation,
    isLoadingGps,
    gpsError,
    requestGpsLocation,
    sortByProximity,
    setSortByProximity,
    distancesMap,
    nearestClient,
    totalWithGps,
    sortedConduces
  } = useConduceProximity({
    conduces: filteredPending,
    getClienteByNumero,
    defaultSortByProximity: true
  });

  // Calcular clientes sin ubicación (para camión)
  const clientesWithoutLocation = useMemo(() => {
    const uniqueClients = new Map<string, { razonSocial: string; numeroCliente: string }>();
    
    filteredPending.forEach(conduce => {
      const client = getClienteByNumero(conduce.numeroCliente);
      const loc = client?.ubicacion || conduce.ubicacion;

      if (!loc || loc.trim().length === 0) {
        const key = conduce.numeroCliente;
        if (!uniqueClients.has(key)) {
          uniqueClients.set(key, {
            razonSocial: conduce.razonSocial || 'Sin nombre',
            numeroCliente: conduce.numeroCliente
          });
        }
      }
    });
    
    return Array.from(uniqueClients.values());
  }, [filteredPending, getClienteByNumero]);

  return (
    <div className="w-full">
      {/* Cabecera y pestañas Camión vs Almacén */}
      <div className="mb-3 px-2 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground py-1">
            {activeSubTab === 'camion' ? 'Conduces en Camión' : 'Conduces en Almacén'}
          </h3>
          <p className="text-xs text-muted-foreground hidden md:block">
            {activeSubTab === 'camion'
              ? 'Conduces listos para entrega en ruta hoy'
              : 'Conduces guardados en almacén (puedes cambiarles la ruta o cargarlos al camión)'}
          </p>
        </div>

        {/* Pestañas compactas minimalistas */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveSubTab('camion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'camion'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>En Camión ({filteredPending.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('almacen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'almacen'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Warehouse className="h-3.5 w-3.5" />
            <span>En Almacén ({filteredWarehouse.length})</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda común */}
      {searchBar && (
        <div className="bg-card rounded-lg border border-border/70 shadow-xs p-3.5 mb-3 mx-2">
          {searchBar}
        </div>
      )}

      {/* Contenido según pestaña activa */}
      {activeSubTab === 'almacen' ? (
        <WarehouseDeliveriesSection
          conduces={filteredWarehouse}
          loading={loadingWarehouse}
          onUpdateRoute={onUpdateRoute || (async () => false)}
          onMoveToTruck={onMoveToTruck || (async () => false)}
          openGoogleMaps={openGoogleMaps}
          userCamion={userCamion}
          isAdmin={isAdmin}
        />
      ) : (
        <>
          {/* Banner de Proximidad GPS y Cliente Más Cercano */}
          {filteredPending.length > 0 && (
            <div className="mx-2 mb-3">
              {nearestClient ? (
                <div className="px-3.5 py-2.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex items-center justify-between flex-wrap gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-foreground">Más cercano:</span>
                        <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-semibold text-xs py-0 px-1.5">
                          {nearestClient.formattedDistance}
                        </Badge>
                        <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-xs font-normal">
                          • {nearestClient.conduce.razonSocial || `Cliente #${nearestClient.conduce.numeroCliente}`}
                          {nearestClient.conduce.ciudad ? ` (${nearestClient.conduce.ciudad})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                      variant={sortByProximity ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortByProximity(!sortByProximity)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-all ${
                        sortByProximity 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      {sortByProximity ? 'Cercanía activa' : 'Ordenar por cercanía'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => requestGpsLocation(false)}
                      disabled={isLoadingGps}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
                      title="Actualizar mi ubicación GPS"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoadingGps ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-xl border border-dashed border-border/80 bg-muted/20 flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {gpsError || 'Activa tu GPS para ver las distancias y ordenar por el cliente más cercano.'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => requestGpsLocation(false)}
                    disabled={isLoadingGps}
                    className="h-7 px-2.5 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg ml-auto shrink-0"
                  >
                    {isLoadingGps ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin text-blue-600" />
                        Buscando GPS...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-3 w-3 mr-1 text-blue-600" />
                        Activar GPS
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {filteredPending.length > 0 && (
            <div className="px-2 mb-4">
              <MapaChoferEntregas 
                conduces={sortedConduces} 
                openGoogleMaps={openGoogleMaps} 
                onDelivery={handleDeliverySelection} 
                onReturn={handleReturnSelection} 
              />
            </div>
          )}
          
          {/* Advertencia de clientes sin ubicación */}
          {clientesWithoutLocation.length > 0 && (
            <Alert variant="destructive" className="mb-4 mx-2 bg-amber-50 border-amber-300 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {clientesWithoutLocation.length} cliente{clientesWithoutLocation.length !== 1 ? 's' : ''} sin ubicación guardada
              </AlertTitle>
              <AlertDescription className="text-amber-700 mt-2">
                <div className="flex flex-wrap gap-2 mt-1">
                  {clientesWithoutLocation.slice(0, 5).map((cliente, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                      {cliente.razonSocial} ({cliente.numeroCliente})
                    </span>
                  ))}
                  {clientesWithoutLocation.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-200 text-amber-800 text-xs font-medium">
                      +{clientesWithoutLocation.length - 5} más
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Suspense fallback={<TableSkeleton />}>
            <LazyEntregasTableWrapper 
              conduces={sortedConduces} 
              onDelivery={handleDeliverySelection} 
              onReturn={handleReturnSelection} 
              openGoogleMaps={openGoogleMaps} 
              renderStatusBadge={renderStatusBadge} 
              isSubmitting={isSubmitting} 
              type="pending" 
              clienteBultosStats={clienteBultosStats} 
              isAdmin={isAdmin}
              distancesMap={distancesMap}
              nearestClientConduceId={nearestClient?.conduce.id}
            />
          </Suspense>
        </>
      )}
    </div>
  );
});

PendingOnlyTable.displayName = 'PendingOnlyTable';