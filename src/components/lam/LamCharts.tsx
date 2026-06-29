import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChartData {
  name: string;
  value: number;
  color: string;
}
interface LamChartsProps {
  chartData: ChartData[];
  regularClientesCount: number;
  visitadoresClientesCount: number;
  devueltosCount: number;
  atrasadosCount: number;
  atrasadosConExcepcionCount: number;
  excepcionesCount: number;
  totalEntregados: number;
  conduces: any[];
  onStateFilter?: (estado: string) => void;
  bultosTotalCount?: number;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.3))', cursor: 'pointer' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
      />
    </g>
  );
};

const LamCharts = ({
  chartData,
  regularClientesCount,
  visitadoresClientesCount,
  devueltosCount,
  atrasadosCount,
  atrasadosConExcepcionCount,
  excepcionesCount,
  totalEntregados,
  conduces,
  onStateFilter,
  bultosTotalCount = 0
}: LamChartsProps) => {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  // Calculate actual bultos delivered on time for regular clients (36h limit)
  const regularBultosOnTime = conduces.filter(c => c?.estado === 'Entregado' && c?.numeroCliente && !c.numeroCliente.startsWith('60')).filter(c => {
    if (!c.tiempoEntrega) return true; // If no delivery time, consider on time
    try {
      const deliveryTimeHours = parseFloat(c.tiempoEntrega.replace('h', ''));
      return deliveryTimeHours <= 36;
    } catch {
      return true;
    }
  }).reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);

  // Calculate actual bultos delivered on time for visitadores clients (60h limit)  
  const visitadoresBultosOnTime = conduces.filter(c => c?.estado === 'Entregado' && c?.numeroCliente && c.numeroCliente.startsWith('60')).filter(c => {
    if (!c.tiempoEntrega) return true; // If no delivery time, consider on time
    try {
      const deliveryTimeHours = parseFloat(c.tiempoEntrega.replace('h', ''));
      return deliveryTimeHours <= 60;
    } catch {
      return true;
    }
  }).reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);

  // Calculate total bultos for each client type for percentage calculation
  const regularTotalBultos = conduces.filter(c => c?.estado === 'Entregado' && c?.numeroCliente && !c.numeroCliente.startsWith('60')).reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);
  const visitadoresTotalBultos = conduces.filter(c => c?.estado === 'Entregado' && c?.numeroCliente && c.numeroCliente.startsWith('60')).reduce((acc, c) => acc + (c?.cantidadBultos || 0), 0);

  // Helper to calculate percentage with decimals
  const calculatePercentage = (value: number, total: number) => {
    if (total <= 0) return '0.00';
    const percentage = value / total * 100;
    return percentage.toFixed(2);
  };
  const updatedChartData = [{
    name: 'Entregados',
    value: chartData.find(d => d.name === 'Entregados')?.value || 0,
    color: '#0A1F44'
  }, {
    name: 'En tránsito',
    value: chartData.find(d => d.name === 'En tránsito')?.value || 0,
    color: '#F5B942'
  }, {
    name: 'Atrasados',
    value: chartData.find(d => d.name === 'Atrasados')?.value || 0,
    color: '#EF4444'
  }, {
    name: 'Entregado con excepción',
    value: chartData.find(d => d.name === 'Entregado con excepción')?.value || 0,
    color: '#8B5CF6'
  }, {
    name: 'Devueltos',
    value: chartData.find(d => d.name === 'Devueltos')?.value || 0,
    color: '#3B82F6'
  }].filter(item => item.value > 0);
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="middle" className="font-semibold text-xs pointer-events-none">
        {`${(percent * 100).toFixed(1)}%`}
      </text>;
  };
  return <Card className="col-span-2 md:col-span-1 overflow-hidden bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-1">
      <CardHeader className="bg-royal-blue border-b border-royal-blue py-2 px-4 rounded-t-xl">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-royal-yellow animate-pulse" />
          Estado de Bultos
        </CardTitle>
        <CardDescription className="text-[10px] text-royal-yellow font-medium">
          Distribución de bultos por estado
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2 pb-2">
        <div className={`flex ${isMobile ? 'flex-col items-center space-y-2' : 'flex-row items-center space-x-3'} min-h-[160px]`}>
          
          {/* 3D Pie Chart Container */}
          <div className="flex-shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-royal-blue/10 via-transparent to-royal-yellow/10 rounded-full blur-xl transform translate-y-2 scale-110 group-hover:scale-125 transition-all duration-700" />
              <div className="relative bg-white/40 backdrop-blur-md rounded-full shadow-lg p-2 border border-white/60">
                <ResponsiveContainer width={isMobile ? 150 : 160} height={isMobile ? 150 : 160}>
                  <PieChart margin={{
                  top: 10,
                  right: 10,
                  bottom: 10,
                  left: 10
                }}>
                    <defs>
                      {updatedChartData.map((entry, index) => <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.8} />
                        </linearGradient>)}
                    </defs>
                    <Pie 
                      data={updatedChartData} 
                      cx="50%" cy="50%" 
                      labelLine={false} 
                      outerRadius={isMobile ? 54 : 58} 
                      innerRadius={isMobile ? 24 : 26} 
                      dataKey="value" 
                      label={renderCustomizedLabel} 
                      strokeWidth={2} 
                      stroke="rgba(255,255,255,0.9)"
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {updatedChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} className="cursor-pointer transition-all duration-500" onClick={() => {
                      onStateFilter?.(entry.name);
                    }} style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                    }} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} bultos`, name]} contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '12px'
                  }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Minimalist Legend - Side by side on desktop */}
          <div className={`${isMobile ? 'w-full max-w-sm' : 'flex-1 max-w-[240px]'} space-y-1`}>
            <div className="grid gap-1">
              {updatedChartData.map((item, index) => <div key={index} className="flex items-center justify-between p-1 rounded bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 hover:shadow-sm transition-all duration-200 cursor-pointer group" onClick={() => onStateFilter?.(item.name)}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-200" style={{
                  background: `linear-gradient(135deg, ${item.color}, ${item.color}90)`,
                  boxShadow: `0 1px 2px ${item.color}40`
                }} />
                    <span className="font-medium text-gray-700 text-[9px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-gray-800 bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent text-[9px]">
                    {calculatePercentage(item.value, bultosTotalCount)}%
                  </span>
                </div>)}
            </div>
            <div className="text-center mt-1.5 p-1.5 rounded bg-royal-blue/5 border border-royal-blue/20">
              <div className="text-[9px] text-gray-500 font-medium">Total recibidos</div>
              <div className="text-xs font-bold text-royal-blue">
                {bultosTotalCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default LamCharts;