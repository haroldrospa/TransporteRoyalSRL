import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, PackageCheck, PackageOpen, RefreshCw, Compass } from 'lucide-react';
import { Region } from '@/types/conduces';

interface MonitoreoHeaderStatsProps {
  totalCamiones: number;
  totalBultos: number;
  bultosEntregados: number;
  bultosPendientes: number;
  bultosDevueltos: number;
  conducesEntregados: number;
  conducesPendientes: number;
  conducesDevueltos: number;
  selectedRegion: Region;
  onRegionChange: (region: Region) => void;
  statusFilter: 'todos' | 'pendientes' | 'entregados' | 'devueltos';
  onStatusFilterChange: (status: 'todos' | 'pendientes' | 'entregados' | 'devueltos') => void;
  activeDatesLabel?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const MonitoreoHeaderStats: React.FC<MonitoreoHeaderStatsProps> = ({
  totalCamiones,
  totalBultos,
  bultosEntregados,
  bultosPendientes,
  bultosDevueltos,
  conducesEntregados,
  conducesPendientes,
  conducesDevueltos,
  selectedRegion,
  onRegionChange,
  statusFilter,
  onStatusFilterChange,
  activeDatesLabel,
  onRefresh,
  isRefreshing = false
}) => {
  const percentEntregado = totalBultos > 0 ? Math.round((bultosEntregados / totalBultos) * 100) : 0;

  // Extraer la primera fecha limpia para evitar listas largas de fechas
  const primaryDate = activeDatesLabel ? activeDatesLabel.split(',')[0].trim() : 'Hoy';

  return (
    <div className="space-y-2.5">
      {/* Barra Superior Minimalista con Identidad de la App */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Título y Estado */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-royal-blue text-white shadow-xs">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Monitoreo de Encomendados
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                En ruta
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                · {primaryDate}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seguimiento satelital en tiempo real de bultos y camiones
            </p>
          </div>
        </div>

        {/* Filtros Sutiles y Botón Refrescar */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Selector de Región */}
          <Select value={selectedRegion} onValueChange={(val) => onRegionChange(val as Region)}>
            <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-28">
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent className="bg-white text-slate-800 border-slate-200">
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Norte">Norte</SelectItem>
              <SelectItem value="Sur">Sur</SelectItem>
              <SelectItem value="Este">Este</SelectItem>
            </SelectContent>
          </Select>

          {/* Selector de Estado */}
          <Select 
            value={statusFilter} 
            onValueChange={(val) => onStatusFilterChange(val as 'todos' | 'pendientes' | 'entregados' | 'devueltos')}
          >
            <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-white text-slate-800 border-slate-200">
              <SelectItem value="todos">Todos los bultos</SelectItem>
              <SelectItem value="pendientes">Por entregar</SelectItem>
              <SelectItem value="entregados">Entregados</SelectItem>
              <SelectItem value="devueltos">Devueltos</SelectItem>
            </SelectContent>
          </Select>

          {/* Botón Refrescar */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shrink-0"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tarjetas KPIs Minimalistas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Camiones en ruta */}
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Camiones en Ruta
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {totalCamiones}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Con entregas activas
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-royal-blue flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Bultos por entregar */}
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Por Entregar
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {bultosPendientes} <span className="text-xs font-normal text-slate-400">bultos</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {conducesPendientes} conduces en camino
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <PackageOpen className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Bultos entregados */}
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Entregados
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {bultosEntregados} <span className="text-xs font-normal text-slate-400">bultos</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {conducesEntregados} conduces completados
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <PackageCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Avance del día */}
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
          <CardContent className="p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Carga Total
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {totalBultos} <span className="text-xs font-normal text-slate-400">bultos</span>
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {percentEntregado}% avance
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-royal-blue dark:bg-royal-yellow h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percentEntregado}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
