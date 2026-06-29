
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Conduce } from '@/types/conduces';
import { getBultosPerMonth } from '@/utils/chartDataUtils';

interface MonthlyBultoData {
  name: string;
  bultos: number;
  color: string;
  percentage: number;
}

interface BultosMonthlyBarChartProps {
  conduces: Conduce[];
  onMonthSelect?: (range: { from: Date; to: Date }) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CHART_COLORS = [
  '#0A1F44', // Royal Blue
  '#F5B942', // Royal Yellow
  '#0A1F44', // Royal Blue
  '#F5B942', // Royal Yellow
  '#0A1F44', // Royal Blue
  '#F5B942', // Royal Yellow
  '#0A1F44', // Royal Blue
  '#F5B942', // Royal Yellow
  '#0A1F44', // Royal Blue
  '#F5B942', // Royal Yellow
  '#0A1F44', // Royal Blue
  '#F5B942'  // Royal Yellow
];

const BultosMonthlyBarChart = ({ conduces, onMonthSelect }: BultosMonthlyBarChartProps) => {
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Calcular datos del gráfico basados en el año seleccionado
  const chartData = useMemo(() => 
    getBultosPerMonth(conduces, selectedYear)
  , [conduces, selectedYear]);

  const handleMonthClick = (monthName: string) => {
    if (!onMonthSelect) return;
    const monthIndex = MONTH_NAMES.indexOf(monthName);
    if (monthIndex < 0) return;
    const from = new Date(selectedYear, monthIndex, 1, 12, 0, 0);
    const to = new Date(selectedYear, monthIndex + 1, 0, 12, 0, 0);
    onMonthSelect({ from, to });
  };

  // Filtrar solo los meses que tienen datos para evitar espacio vacío
  const dataWithValues = chartData.filter(item => item.bultos > 0);
  
  // Si no hay datos, mostrar mensaje
  if (dataWithValues.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-1">
        <CardHeader className="bg-royal-blue border-b border-royal-blue py-2 px-4 rounded-t-xl">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-royal-yellow animate-pulse" />
            Bultos por Mes
          </CardTitle>
          <CardDescription className="text-sm text-royal-yellow">
            Distribución mensual de bultos entregados
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center h-40 text-gray-500">
            <p>No hay datos de bultos para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-1">
      <CardHeader className="bg-royal-blue border-b border-royal-blue py-2 px-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-royal-yellow animate-pulse" />
              Bultos por Mes
            </CardTitle>
            <CardDescription className="text-[10px] text-royal-yellow">
              Distribución mensual de bultos entregados
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
              onClick={() => setSelectedYear(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-white min-w-[50px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
              onClick={() => setSelectedYear(prev => prev + 1)}
              disabled={selectedYear >= currentYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-2">
        <ChartContainer
          config={{
            bultos: {
              label: "Bultos"
            }
          }}
          className="w-full h-[160px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataWithValues}
              margin={{
                top: 25,
                right: 10,
                left: 5,
                bottom: 35,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={6}
                tick={{ fill: '#666', fontSize: 8, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={4}
                tick={{ fill: '#666', fontSize: 8 }}
                width={35}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-sm p-2 border border-gray-200 rounded shadow-lg text-[10px]">
                        <p className="font-bold text-gray-800 mb-0.5">{label}</p>
                        <p className="text-gray-600">
                          <span className="font-medium">Bultos:</span> {data.bultos}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Porcentaje:</span> {data.percentage}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="bultos"
                radius={[4, 4, 0, 0]}
                barSize={45}
                onClick={(data: any) => handleMonthClick(data?.name)}
                cursor={onMonthSelect ? 'pointer' : 'default'}
                label={{
                  position: 'top',
                  fill: '#fff',
                  fontSize: 9,
                  fontWeight: 'bold',
                  formatter: (value: number) => value
                }}
              >
                {dataWithValues.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    className="transition-all duration-500 hover:brightness-125 drop-shadow-sm cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Leyenda con porcentajes debajo del gráfico */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
          {dataWithValues.map((item, index) => (
            <button
              type="button"
              key={index}
              onClick={() => handleMonthClick(item.name)}
              className="flex items-center gap-1 group cursor-pointer focus:outline-none"
            >
              <div 
                className="text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm transition-all group-hover:scale-105 border border-white/20"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              >
                {item.percentage}%
              </div>
              <div 
                className="text-[9px] font-semibold transition-colors"
                style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
              >
                {item.name}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BultosMonthlyBarChart;
