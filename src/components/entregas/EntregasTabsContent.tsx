
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntregasTableWrapper } from './EntregasTableWrapper';
import { Conduce } from '@/types/conduces';

interface EntregasTabsContentProps {
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

export const EntregasTabsContent = ({
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
}: EntregasTabsContentProps) => {
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
        <EntregasTableWrapper
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
      </TabsContent>

      <TabsContent value="completadas" className="mt-4">
        <EntregasTableWrapper
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
      </TabsContent>

      <TabsContent value="devueltas" className="mt-4">
        <EntregasTableWrapper
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
      </TabsContent>
    </Tabs>
  );
};
