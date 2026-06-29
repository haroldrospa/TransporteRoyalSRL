import React, { memo, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Conduce } from '@/types/conduces';

// Lazy load table wrapper for better performance
const LazyEntregasTableWrapper = lazy(() => 
  import('./EntregasTableWrapper').then(module => ({ default: module.EntregasTableWrapper }))
);

interface OptimizedEntregasTabsContentProps {
  filteredPending: Conduce[];
  filteredCompleted: Conduce[];
  filteredReturned: Conduce[];
  handleDeliverySelection: (conduce: Conduce) => void;
  handleReturnSelection: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined) => void;
  showDetails: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  isSubmitting: boolean;
  clienteBultosStats?: Record<string, { totalBultos: number; totalConduces: number }>;
  isAdmin?: boolean;
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

export const OptimizedEntregasTabsContent = memo(({
  filteredPending,
  filteredCompleted,
  filteredReturned,
  handleDeliverySelection,
  handleReturnSelection,
  openGoogleMaps,
  showDetails,
  renderStatusBadge,
  isSubmitting,
  clienteBultosStats,
  isAdmin = false
}: OptimizedEntregasTabsContentProps) => {
  return (
    <Tabs defaultValue="pendientes" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pendientes" className="flex items-center gap-2">
          Pendientes ({filteredPending.length})
        </TabsTrigger>
        <TabsTrigger value="completadas" className="flex items-center gap-2">
          Completadas ({filteredCompleted.length})
        </TabsTrigger>
        <TabsTrigger value="devueltas" className="flex items-center gap-2">
          Devueltas ({filteredReturned.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pendientes" className="mt-4">
        <Suspense fallback={<TableSkeleton />}>
          <LazyEntregasTableWrapper
            conduces={filteredPending}
            onDelivery={handleDeliverySelection}
            onReturn={handleReturnSelection}
            openGoogleMaps={openGoogleMaps}
            renderStatusBadge={renderStatusBadge}
            isSubmitting={isSubmitting}
            type="pending"
            clienteBultosStats={clienteBultosStats}
            isAdmin={isAdmin}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="completadas" className="mt-4">
        <Suspense fallback={<TableSkeleton />}>
          <LazyEntregasTableWrapper
            conduces={filteredCompleted}
            onDelivery={handleDeliverySelection}
            onReturn={handleReturnSelection}
            openGoogleMaps={openGoogleMaps}
            showDetails={showDetails}
            renderStatusBadge={renderStatusBadge}
            isSubmitting={isSubmitting}
            type="completed"
            clienteBultosStats={clienteBultosStats}
            isAdmin={isAdmin}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="devueltas" className="mt-4">
        <Suspense fallback={<TableSkeleton />}>
          <LazyEntregasTableWrapper
            conduces={filteredReturned}
            onDelivery={handleDeliverySelection}
            onReturn={handleReturnSelection}
            openGoogleMaps={openGoogleMaps}
            renderStatusBadge={renderStatusBadge}
            isSubmitting={isSubmitting}
            type="returned"
            clienteBultosStats={clienteBultosStats}
            isAdmin={isAdmin}
          />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
});

OptimizedEntregasTabsContent.displayName = 'OptimizedEntregasTabsContent';