import React, { memo, Suspense, lazy, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Conduce } from '@/types/conduces';
import { AlertTriangle, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapaChoferEntregas } from './MapaChoferEntregas';
import { useData } from '@/contexts/DataContext';

// Lazy load table wrapper for better performance
const LazyEntregasTableWrapper = lazy(() => import('./EntregasTableWrapper').then(module => ({
  default: module.EntregasTableWrapper
})));
interface PendingOnlyTableProps {
  filteredPending: Conduce[];
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
}
const TableSkeleton = memo(() => <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>);
TableSkeleton.displayName = 'TableSkeleton';
export const PendingOnlyTable = memo(({
  filteredPending,
  handleDeliverySelection,
  handleReturnSelection,
  openGoogleMaps,
  showDetails,
  renderStatusBadge,
  isSubmitting,
  clienteBultosStats,
  isAdmin = false,
  searchBar
}: PendingOnlyTableProps) => {
  const { getClienteByNumero } = useData();

  // Calcular clientes sin ubicación
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

  return <div className="w-full">
      <div className="mb-4 px-2">
        <h3 className="text-lg font-semibold text-foreground py-[9px]">
          Conduces Pendientes ({filteredPending.length})
        </h3>
        <p className="text-sm text-muted-foreground hidden md:block">
          Solo se muestran los conduces en tránsito pendientes de entrega
        </p>
      </div>

      {filteredPending.length > 0 && (
        <div className="px-2 mb-4">
          <MapaChoferEntregas 
            conduces={filteredPending} 
            openGoogleMaps={openGoogleMaps} 
            onDelivery={handleDeliverySelection}
            onReturn={handleReturnSelection}
          />
        </div>
      )}
      
      {searchBar && (
        <div className="bg-card rounded-lg border shadow-sm p-4 mb-4 mx-2">
          {searchBar}
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
        <LazyEntregasTableWrapper conduces={filteredPending} onDelivery={handleDeliverySelection} onReturn={handleReturnSelection} openGoogleMaps={openGoogleMaps} renderStatusBadge={renderStatusBadge} isSubmitting={isSubmitting} type="pending" clienteBultosStats={clienteBultosStats} isAdmin={isAdmin} />
      </Suspense>
    </div>;
});
PendingOnlyTable.displayName = 'PendingOnlyTable';