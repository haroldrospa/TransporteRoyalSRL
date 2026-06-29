
import { OptimizedConducesTable } from './OptimizedConducesTable';
import { Conduce } from '@/types/conduces';

interface EntregasTableWrapperProps {
  conduces: Conduce[];
  onDelivery: (conduce: Conduce) => void;
  onReturn: (conduce: Conduce) => void;
  openGoogleMaps: (ubicacion: string | undefined, clienteNombre?: string) => void;
  showDetails?: (conduce: Conduce) => void;
  renderStatusBadge: (estado: string) => JSX.Element;
  isSubmitting: boolean;
  type: 'pending' | 'completed' | 'returned';
  clienteBultosStats?: Record<string, { totalBultos: number; totalConduces: number }>;
  isAdmin?: boolean;
}

export const EntregasTableWrapper = ({
  conduces,
  onDelivery,
  onReturn,
  openGoogleMaps,
  showDetails,
  renderStatusBadge,
  isSubmitting,
  type,
  clienteBultosStats,
  isAdmin = false
}: EntregasTableWrapperProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto w-full">
      <OptimizedConducesTable
        conduces={conduces}
        onDelivery={onDelivery}
        onReturn={onReturn}
        openGoogleMaps={openGoogleMaps}
        showDetails={showDetails}
        renderStatusBadge={renderStatusBadge}
        isSubmitting={isSubmitting}
        type={type}
        clienteBultosStats={clienteBultosStats}
        isAdmin={isAdmin}
      />
    </div>
  );
};
