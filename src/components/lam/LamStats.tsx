
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TruckIcon, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LamStatsProps {
  latestLoadDate: string;
  bultosEnTransito: number;
  bultosTotalCount: number;
  clientesEnTransito: number;
  bultosEntregados: number;
  bultosDevueltos: number;
  bultosAtrasados?: number;
  totalBultosEntregadosDB?: number;
  onStateFilter?: (estado: string) => void;
}

const CustomStatCard = ({
  title,
  value,
  percentage,
  icon: Icon,
  subtitle,
  onClick,
  estado,
}: {
  title: string;
  value: number;
  percentage?: number;
  icon: any;
  subtitle?: string;
  onClick?: (estado: string) => void;
  estado?: string;
}) => (
  <Card 
    className={`shadow-md hover:shadow-xl transition-all border border-gray-100 border-l-4 border-l-royal-blue bg-white ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    onClick={() => onClick && estado && onClick(estado)}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div>
        <CardTitle className="text-sm font-bold text-gray-700 tracking-tight">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center justify-center rounded-full p-2 bg-royal-blue/10">
        <Icon className="h-5 w-5 text-royal-blue" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-3xl font-bold text-royal-blue mb-3">{value}</div>
      {percentage !== undefined && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full">
            <div
              className="bg-royal-yellow h-2 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-royal-yellow">
            {percentage}%
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const LamStats = ({
  bultosEnTransito,
  bultosTotalCount,
  clientesEnTransito,
  bultosEntregados,
  bultosDevueltos,
  bultosAtrasados = 0,
  totalBultosEntregadosDB,
  onStateFilter
}: LamStatsProps) => {
  const isMobile = useIsMobile();

  // Helper to calculate percentage with decimals
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  // Calculate percentages for each state
  const entregadosPercentage = calculatePercentage(bultosEntregados, bultosTotalCount);
  const transitoPercentage = calculatePercentage(bultosEnTransito, bultosTotalCount);
  const atrasadosPercentage = calculatePercentage(bultosAtrasados, bultosTotalCount);
  const devueltosPercentage = calculatePercentage(bultosDevueltos, bultosTotalCount);

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        <CustomStatCard
          title="Bultos en tránsito"
          value={bultosEnTransito}
          icon={TruckIcon}
          subtitle={`De un total de ${bultosTotalCount} bultos`}
          onClick={onStateFilter}
          estado="En tránsito"
        />
        <CustomStatCard
          title="Clientes en tránsito"
          value={clientesEnTransito}
          icon={Users}
          subtitle="Clientes con entregas pendientes"
        />
        <CustomStatCard
          title="Bultos entregados"
          value={bultosEntregados}
          icon={Package}
          subtitle={`${bultosDevueltos} bultos devueltos`}
          onClick={onStateFilter}
          estado="Entregado"
        />
      </div>
    </div>
  );
};

export default LamStats;
