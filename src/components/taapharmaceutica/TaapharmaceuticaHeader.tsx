
import { useAuth } from '@/contexts/AuthContext';
import LAMActions from '@/components/lam/LAMActions';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaapharmaceuticaHeaderProps {
  regionActual: string;
  loading: boolean;
  onRefresh: () => Promise<void>;
  conduces: any[];
  stats?: {
    bultosEnTransito: number;
    bultosTotalCount: number;
    clientesEnTransito: number;
    bultosEntregados: number;
    bultosDevueltos: number;
  };
  chartInfo?: {
    regularClientesCount: number;
    visitadoresClientesCount: number;
    devueltosCount: number;
    atrasadosCount: number;
    excepcionesCount: number;
    totalEntregados: number;
  };
}

const TaapharmaceuticaHeader = ({ regionActual, loading, onRefresh, conduces, stats, chartInfo }: TaapharmaceuticaHeaderProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'}`}>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Panel Taapharmaceutica - Región {regionActual}</h1>
        <p className="text-sm text-muted-foreground">
          Gestión y seguimiento de conduce y bultos Taapharmaceutica
        </p>
      </div>

      <LAMActions 
        onRefresh={onRefresh}
        loading={loading}
        userLevel={user?.nivel}
        conduces={conduces}
        stats={stats}
        chartInfo={chartInfo}
        laboratorio="Taapharmaceutica"
      />
    </div>
  );
};

export default TaapharmaceuticaHeader;
