import { useAuth } from '@/contexts/AuthContext';
import LAMActions from '@/components/lam/LAMActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface DemoLaboratorioHeaderProps {
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

const DemoLaboratorioHeader = ({
  regionActual,
  loading,
  onRefresh,
  conduces,
  stats,
  chartInfo
}: DemoLaboratorioHeaderProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'}`}>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Panel Laboratorio - Región {regionActual}</h1>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs py-0.5">
            <Sparkles className="h-3 w-3" />
            Modo Demostración
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestión y seguimiento de conduces y bultos en tiempo real
        </p>
      </div>

      <LAMActions 
        onRefresh={onRefresh}
        loading={loading}
        userLevel={user?.nivel}
        conduces={conduces}
        stats={stats}
        chartInfo={chartInfo}
        laboratorio="Laboratorio Demo"
      />
    </div>
  );
};

export default DemoLaboratorioHeader;
