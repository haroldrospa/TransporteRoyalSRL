import LamCharts from '@/components/lam/LamCharts';
import BultosMonthlyBarChart from '@/components/lam/BultosMonthlyBarChart';
import MapaEntregasRD from '@/components/lam/MapaEntregasRD';
import { Conduce } from '@/types/conduces';

interface LAMStatsAndChartsProps {
  chartInfo: {
    chartData: any[];
    regularClientesCount: number;
    visitadoresClientesCount: number;
    devueltosCount: number;
    atrasadosCount: number;
    atrasadosConExcepcionCount: number;
    excepcionesCount: number;
    totalEntregados: number;
  };
  allConduces: Conduce[];
  conduces: any[];
  onStateFilter?: (estado: string) => void;
  bultosTotalCount?: number;
  onMonthSelect?: (range: { from: Date; to: Date }) => void;
}

const LAMStatsAndCharts = ({
  chartInfo,
  allConduces,
  conduces,
  onStateFilter,
  bultosTotalCount,
  onMonthSelect
}: LAMStatsAndChartsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <LamCharts {...chartInfo} conduces={conduces} onStateFilter={onStateFilter} bultosTotalCount={bultosTotalCount} />
        <BultosMonthlyBarChart conduces={allConduces} onMonthSelect={onMonthSelect} />
      </div>
      
      <MapaEntregasRD conduces={conduces} />
    </div>
  );
};
export default LAMStatsAndCharts;