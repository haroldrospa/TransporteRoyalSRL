import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

const LamCharts = ({
  chartData,
  conduces,
  onStateFilter,
  bultosTotalCount = 0
}: LamChartsProps) => {
  const isMobile = useIsMobile();

  // Helper to calculate percentage with decimals
  const calculatePercentage = (value: number, total: number) => {
    if (total <= 0) return '0.00';
    return (value / total * 100).toFixed(2);
  };

  const updatedChartData = (chartData && chartData.length > 0 ? chartData : [])
    .map(d => {
      let color = d.color;
      if (d.name === 'Entregados') color = '#0A1F44';
      else if (d.name === 'Atrasados') color = '#F59E0B';
      else if (d.name === 'En tránsito') color = '#3B82F6';
      else if (d.name === 'Devueltos') color = '#EF4444';
      return { ...d, color };
    })
    .filter(item => item.value > 0);

  const totalChartBultos = bultosTotalCount || updatedChartData.reduce((acc, item) => acc + item.value, 0);

  const deliveredBultosSum = (updatedChartData.find(d => d.name === 'Entregados')?.value || 0) +
                             (updatedChartData.find(d => d.name === 'Atrasados')?.value || 0);

  return (
    <Card className="col-span-2 md:col-span-1 overflow-hidden bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-1 rounded-xl">
      <CardHeader className="bg-royal-blue border-b border-royal-blue py-2 px-4 rounded-t-xl">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-royal-yellow animate-pulse" />
          Estado de Bultos
        </CardTitle>
        <CardDescription className="text-[10px] text-royal-yellow font-medium">
          Distribución de bultos por estado
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        <div className={`flex ${isMobile ? 'flex-col items-center space-y-4' : 'flex-row items-center justify-around space-x-4'} min-h-[160px]`}>
          
          {/* Minimalist 2D Donut Chart */}
          <div className="flex-shrink-0 relative">
            <div className="relative group animate-in zoom-in-75 fade-in duration-500 ease-out">
              
              <div className="relative bg-white rounded-full p-1">
                <ResponsiveContainer width={isMobile ? 145 : 155} height={isMobile ? 145 : 155}>
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={updatedChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 42 : 46}
                      outerRadius={isMobile ? 58 : 64}
                      dataKey="value"
                      stroke="#FFFFFF"
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={600}
                    >
                      {updatedChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="cursor-pointer transition-opacity duration-200 outline-none hover:opacity-85"
                          onClick={() => onStateFilter?.(entry.name)}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                      formatter={(value: number, name: string) => [
                        `${Number(value).toLocaleString()} bultos (${calculatePercentage(Number(value), totalChartBultos)}%)`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: '#0A1F44',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '6px 10px'
                      }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Clean Minimalist Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Entregas</span>
                  <span className="text-base font-extrabold text-[#0A1F44] leading-none mt-0.5">
                    {calculatePercentage(deliveredBultosSum, totalChartBultos)}%
                  </span>
                </div>

              </div>
            </div>
          </div>
          
          {/* Minimalist Legend */}
          <div className={`${isMobile ? 'w-full max-w-sm' : 'flex-1 max-w-[240px]'} flex flex-col justify-center space-y-2`}>
            <div className="space-y-1.5">
              {updatedChartData.map((item, index) => {
                const percentVal = calculatePercentage(item.value, totalChartBultos);
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200 cursor-pointer group gap-2" 
                    onClick={() => onStateFilter?.(item.name)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-white shadow-sm transition-transform duration-200 group-hover:scale-110 flex-shrink-0" 
                        style={{ background: item.color }} 
                      />
                      <span className="font-semibold text-slate-600 text-xs transition-colors duration-200 group-hover:text-slate-900 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-extrabold text-slate-800 text-xs">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="font-medium text-slate-500 text-[11px]">
                        ({percentVal}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Total count badge */}
            <div className="p-2 rounded-lg bg-royal-blue/5 border border-royal-blue/10 flex items-center justify-between">
              <span className="text-[10px] text-royal-blue font-bold uppercase tracking-wider">Total Recibidos</span>
              <span className="text-xs font-extrabold text-royal-blue">
                {bultosTotalCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LamCharts;