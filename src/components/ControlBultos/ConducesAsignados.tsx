import { useState, useMemo } from 'react';
import { Conduce } from '@/types/conduces';
import { 
  Loader2, 
  GitBranch, 
  Warehouse, 
  Truck, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Calendar,
  CheckSquare,
  Square,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProcessingOverlay from '@/components/cargar-camiones/ProcessingOverlay';
import { getRegionByTruck, getTruckWarehouse, getBaseTruck } from '@/utils/trucksByRegion';
import { clearUltraCache } from '@/services/conduces/ultraFastFetchConduces';
import { 
  ProgramacionSemanal, 
  getRutaProgramadaHoy, 
  coincideRutaConProgramacion, 
  transferirConducesAAlmacen, 
  transferirConducesACamion,
  asignarConducesConDivisionRuta 
} from '@/services/rutasProgramacionService';

interface ConducesAsignadosProps {
  encomendadosList: string[];
  loading: boolean;
  getConducesByEncomendado: (encomendado: string) => Conduce[];
  clientes: any[];
  refreshData?: () => void;
  programacion?: ProgramacionSemanal;
}

const ConducesAsignados = ({
  encomendadosList,
  loading,
  getConducesByEncomendado,
  clientes,
  refreshData,
  programacion = {}
}: ConducesAsignadosProps) => {
  const [isDividing, setIsDividing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  // Filter inside truck tab: 'camion' | 'almacen' | 'todos'
  const [viewFilter, setViewFilter] = useState<'camion' | 'almacen' | 'todos'>('camion');
  const [almacenTruckFilter, setAlmacenTruckFilter] = useState<string>('todos');
  const [routeFilter, setRouteFilter] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInTab, setSelectedInTab] = useState<string[]>([]);

  const getConduceRoute = (conduce: Conduce): string => {
    if (conduce.ruta) return conduce.ruta;
    const cl = clientes.find(c => c.numeroCliente === conduce.numeroCliente);
    return cl?.ruta || '0';
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedInTab(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (conduces: Conduce[]) => {
    if (selectedInTab.length === conduces.length && conduces.length > 0) {
      setSelectedInTab([]);
    } else {
      setSelectedInTab(conduces.map(c => c.id));
    }
  };

  // Move out-of-schedule routes to truck's warehouse
  const handleMoverRutasNoHoy = async (camion: string, conducesAMover: Conduce[], whName: string, rutaHoy: string) => {
    if (conducesAMover.length === 0) return;
    setIsTransferring(true);
    try {
      const ids = conducesAMover.map(c => c.id);
      const res = await transferirConducesAAlmacen(ids, camion);
      if (res.success) {
        toast({
          title: "Conduces enviados a almacén",
          description: `Se movieron ${res.count} conduces a ${whName} porque hoy corresponde ${rutaHoy === 'Todas' ? 'Todas' : `Ruta ${rutaHoy}`}.`,
        });
        setSelectedInTab([]);
        if (refreshData) refreshData();
      } else {
        toast({
          title: "Error",
          description: "No se pudieron transferir los conduces al almacén.",
          variant: "destructive"
        });
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // Move selected conduces to warehouse
  const handleMoverSeleccionadosAAlmacen = async (camion: string) => {
    if (selectedInTab.length === 0) return;
    setIsTransferring(true);
    try {
      const whName = getTruckWarehouse(camion);
      const res = await transferirConducesAAlmacen(selectedInTab, camion);
      if (res.success) {
        toast({
          title: "Conduces movidos a almacén",
          description: `${res.count} conduces trasladados a ${whName}.`,
        });
        setSelectedInTab([]);
        if (refreshData) refreshData();
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // Move selected warehouse conduces to truck
  const handleMoverSeleccionadosACamion = async (camion: string) => {
    if (selectedInTab.length === 0) return;
    setIsTransferring(true);
    try {
      const base = getBaseTruck(camion);
      const res = await transferirConducesACamion(selectedInTab, base);
      if (res.success) {
        toast({
          title: "Conduces cargados al camión",
          description: `${res.count} conduces asignados a ${base}.`,
        });
        setSelectedInTab([]);
        if (refreshData) refreshData();
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // Dividir todos los camiones según la ruta programada de hoy
  const handleDividirTodosPorRuta = async () => {
    setIsTransferring(true);
    try {
      const trucks = encomendadosList.filter(t => t !== 'Almacen');
      let totalMovidos = 0;

      for (const t of trucks) {
        const baseTruck = getBaseTruck(t);
        const rutaHoy = getRutaProgramadaHoy(programacion, baseTruck);
        const camConduces = getConducesByEncomendado(t);

        const aMover = camConduces.filter(c => {
          const r = getConduceRoute(c);
          return !coincideRutaConProgramacion(r, rutaHoy);
        });

        if (aMover.length > 0) {
          const res = await transferirConducesAAlmacen(aMover.map(c => c.id), baseTruck);
          if (res.success) totalMovidos += res.count;
        }
      }

      if (refreshData) await refreshData();

      if (totalMovidos > 0) {
        toast({
          title: "División completada",
          description: `Se movieron ${totalMovidos} conduces a almacén según la ruta de hoy.`,
        });
      } else {
        toast({
          title: "Todo al día",
          description: "Todos los conduces en camiones ya coinciden con la ruta de hoy (o son Ruta 0).",
        });
      }
    } catch (err) {
      console.error('Error dividiendo todos:', err);
      toast({
        title: "Error",
        description: "No se pudieron dividir los conduces.",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Función para dividir los conduces de Almacén
  const handleDividirAlmacen = async () => {
    setIsDividing(true);
    try {
      const almacenConduces = getConducesByEncomendado('Almacen');
      
      if (almacenConduces.length === 0) {
        toast({
          title: "Información",
          description: "No hay conduces asignados a Almacén General",
        });
        return;
      }

      const res = await asignarConducesConDivisionRuta(
        almacenConduces.map(c => c.id),
        'AUTO_CLIENTE',
        {
          conduces: almacenConduces,
          clientes,
          programacion
        }
      );

      if (refreshData) await refreshData();

      toast({
        title: "División completada",
        description: res.mensaje,
      });
    } catch (error) {
      console.error('Error dividiendo conduces:', error);
      toast({
        title: "Error",
        description: "No se pudieron dividir los conduces",
        variant: "destructive"
      });
    } finally {
      setIsDividing(false);
    }
  };

  return (
    <>
      <ProcessingOverlay 
        isProcessing={isDividing || isTransferring} 
        message={isDividing ? "Reasignando conduces a cada chofer..." : "Moviendo conduces entre camión y almacén..."} 
      />
      <Card className="col-span-1 md:col-span-2 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Truck className="h-4 w-4 text-royal-blue" />
            Conduces Asignados
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium border-royal-blue/30 text-royal-blue hover:bg-royal-blue/10 flex items-center gap-1.5"
            onClick={handleDividirTodosPorRuta}
            disabled={isTransferring || loading}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Dividir por ruta de hoy</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-44">
              <Loader2 className="h-8 w-8 animate-spin text-royal-blue" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando conduces asignados...</span>
            </div>
          ) : (
            <Tabs 
              defaultValue={encomendadosList[0]} 
              onValueChange={() => { 
                setSelectedInTab([]); 
                setRouteFilter('todas'); 
                setSearchQuery(''); 
              }}
            >
              <TabsList className="w-full overflow-x-auto flex justify-start mb-2">
                {encomendadosList.map(enc => (
                  <TabsTrigger key={enc} value={enc} className="flex-1 text-xs">
                    {enc === 'Almacen' ? '🏢 Almacen' : enc}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {encomendadosList.map(enc => {
                const isGeneralAlmacen = enc === 'Almacen';
                const whName = isGeneralAlmacen ? 'Almacen' : getTruckWarehouse(enc);
                
                // Conduces on truck
                const camConduces = isGeneralAlmacen ? [] : getConducesByEncomendado(enc);
                // Conduces in this truck's warehouse
                const whConduces = isGeneralAlmacen 
                  ? getConducesByEncomendado('Almacen')
                  : getConducesByEncomendado(whName);

                // For the general warehouse tab: also gather all specific warehouse conduces
                const allWarehouseConduces = isGeneralAlmacen
                  ? encomendadosList
                      .filter(t => t !== 'Almacen')
                      .flatMap(t => getConducesByEncomendado(getTruckWarehouse(t)))
                      .concat(whConduces)
                  : [];

                // Scheduled route today for this truck
                const rutaHoy = isGeneralAlmacen ? 'Todas' : getRutaProgramadaHoy(programacion, enc);

                // Identify conduces whose route does not match today's schedule
                const conducesRutaDiferente = camConduces.filter(c => {
                  const r = getConduceRoute(c);
                  return !coincideRutaConProgramacion(r, rutaHoy);
                });

                // Base conduces available in this tab view
                let baseConduces: Conduce[] = [];
                if (isGeneralAlmacen) {
                  if (almacenTruckFilter === 'todos') {
                    baseConduces = allWarehouseConduces;
                  } else if (almacenTruckFilter === 'general') {
                    baseConduces = whConduces;
                  } else {
                    baseConduces = getConducesByEncomendado(almacenTruckFilter);
                  }
                } else {
                  if (viewFilter === 'camion') baseConduces = camConduces;
                  else if (viewFilter === 'almacen') baseConduces = whConduces;
                  else baseConduces = [...camConduces, ...whConduces];
                }

                // Routes present in the base set
                const routesMap = new Map<string, number>();
                baseConduces.forEach(c => {
                  const r = getConduceRoute(c);
                  routesMap.set(r, (routesMap.get(r) || 0) + 1);
                });
                const uniqueRoutesList = Array.from(routesMap.keys()).sort((a, b) => {
                  if (a === '1') return -1;
                  if (b === '1') return 1;
                  if (a === '2') return -1;
                  if (b === '2') return 1;
                  return a.localeCompare(b);
                });

                const countMatchHoy = baseConduces.filter(c => coincideRutaConProgramacion(getConduceRoute(c), rutaHoy)).length;
                const countNoMatchHoy = baseConduces.length - countMatchHoy;

                // Conduces filtered by route and search
                const displayedConduces = baseConduces.filter(c => {
                  const r = getConduceRoute(c);
                  if (routeFilter === 'hoy') {
                    if (!coincideRutaConProgramacion(r, rutaHoy)) return false;
                  } else if (routeFilter === 'no_hoy') {
                    if (coincideRutaConProgramacion(r, rutaHoy)) return false;
                  } else if (routeFilter !== 'todas') {
                    if (r !== routeFilter) return false;
                  }

                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    const matchesConduce = c.numeroConduce?.toLowerCase().includes(q);
                    const matchesCliente = c.razonSocial?.toLowerCase().includes(q) || c.numeroCliente?.toLowerCase().includes(q);
                    const matchesCiudad = c.ciudad?.toLowerCase().includes(q);
                    if (!matchesConduce && !matchesCliente && !matchesCiudad) return false;
                  }
                  return true;
                });

                const totalBultos = displayedConduces.reduce((sum, c) => sum + c.cantidadBultos, 0);
                const totalClientes = new Set(displayedConduces.map(c => c.numeroCliente)).size;

                return (
                  <TabsContent key={enc} value={enc}>
                    <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                      
                      {/* Sub-header / route banner for individual trucks */}
                      {!isGeneralAlmacen && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-background rounded-md border text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-royal-blue" />
                            <span>Ruta programada para hoy:</span>
                            <Badge className="bg-royal-blue text-white font-bold text-xs">
                              {rutaHoy === 'Todas' ? 'Todas las Rutas' : rutaHoy === 'Descanso' ? 'Descanso' : `Ruta ${rutaHoy}`}
                            </Badge>

                            {conducesRutaDiferente.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[11px] font-medium border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 ml-1 cursor-pointer transition-colors"
                                onClick={() => handleMoverRutasNoHoy(enc, conducesRutaDiferente, whName, rutaHoy)}
                                disabled={isTransferring}
                              >
                                <Warehouse className="h-3 w-3 text-amber-600" />
                                Dividir a almacén ({conducesRutaDiferente.length})
                              </Button>
                            )}
                          </div>

                          {/* Quick sub-filter: En Camión / En Almacén / Todos */}
                          <div className="flex items-center gap-1 bg-muted p-0.5 rounded border text-xs">
                            <button
                              type="button"
                              onClick={() => { setViewFilter('camion'); setSelectedInTab([]); }}
                              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                viewFilter === 'camion' 
                                  ? 'bg-background shadow-sm text-foreground font-bold' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Truck className="h-3 w-3" />
                              En Camión ({camConduces.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => { setViewFilter('almacen'); setSelectedInTab([]); }}
                              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                viewFilter === 'almacen' 
                                  ? 'bg-background shadow-sm text-foreground font-bold' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Warehouse className="h-3 w-3 text-amber-600" />
                              En Almacén ({whConduces.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => { setViewFilter('todos'); setSelectedInTab([]); }}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                viewFilter === 'todos' 
                                  ? 'bg-background shadow-sm text-foreground font-bold' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Todos ({camConduces.length + whConduces.length})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Header for General Almacen */}
                      {isGeneralAlmacen && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium">Ver Almacén:</label>
                            <select
                              className="p-1 text-xs border rounded bg-background"
                              value={almacenTruckFilter}
                              onChange={(e) => { setAlmacenTruckFilter(e.target.value); setSelectedInTab([]); }}
                            >
                              <option value="todos">Todos los almacenes ({allWarehouseConduces.length})</option>
                              <option value="general">Almacén General ({whConduces.length})</option>
                              {encomendadosList.filter(t => t !== 'Almacen').map(t => {
                                const tWh = getTruckWarehouse(t);
                                const count = getConducesByEncomendado(tWh).length;
                                return (
                                  <option key={tWh} value={tWh}>
                                    {tWh} - Almacén {t} ({count})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {whConduces.length > 0 && (
                            <Button 
                              onClick={handleDividirAlmacen}
                              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-semibold"
                              size="sm"
                              disabled={isDividing}
                            >
                              <GitBranch className="h-3.5 w-3.5 mr-1" />
                              Dividir Almacén General
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Route filter & quick search bar */}
                      <div className="p-2.5 bg-background rounded-md border flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                            <Filter className="h-3.5 w-3.5 text-royal-blue" />
                            Filtrar Ruta:
                          </span>

                          {/* Todas */}
                          <Button
                            type="button"
                            variant={routeFilter === 'todas' ? 'default' : 'outline'}
                            size="sm"
                            className={`h-7 px-2.5 text-xs rounded-full font-medium transition-all ${
                              routeFilter === 'todas'
                                ? 'bg-royal-blue text-white shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => { setRouteFilter('todas'); setSelectedInTab([]); }}
                          >
                            Todas ({baseConduces.length})
                          </Button>

                          {/* Solo de hoy */}
                          {!isGeneralAlmacen && rutaHoy !== 'Todas' && rutaHoy !== 'Descanso' && (
                            <Button
                              type="button"
                              variant={routeFilter === 'hoy' ? 'default' : 'outline'}
                              size="sm"
                              className={`h-7 px-2.5 text-xs rounded-full font-medium transition-all ${
                                routeFilter === 'hoy'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              onClick={() => { setRouteFilter('hoy'); setSelectedInTab([]); }}
                            >
                              🎯 Solo de hoy (Ruta {rutaHoy}) ({countMatchHoy})
                            </Button>
                          )}

                          {/* Fuera de hoy */}
                          {!isGeneralAlmacen && countNoMatchHoy > 0 && rutaHoy !== 'Todas' && rutaHoy !== 'Descanso' && (
                            <Button
                              type="button"
                              variant={routeFilter === 'no_hoy' ? 'default' : 'outline'}
                              size="sm"
                              className={`h-7 px-2.5 text-xs rounded-full font-medium transition-all ${
                                routeFilter === 'no_hoy'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              }`}
                              onClick={() => { setRouteFilter('no_hoy'); setSelectedInTab([]); }}
                            >
                              ⚠️ Fuera de ruta ({countNoMatchHoy})
                            </Button>
                          )}

                          {/* Individual routes pills */}
                          {uniqueRoutesList.map(r => {
                            const count = routesMap.get(r) || 0;
                            const isActive = routeFilter === r;
                            const isRuta1 = r === '1';
                            const isRuta2 = r === '2';
                            const label = r ? `Ruta ${r}` : 'Sin ruta';

                            return (
                              <Button
                                key={r}
                                type="button"
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                className={`h-7 px-2.5 text-xs rounded-full font-medium transition-all ${
                                  isActive
                                    ? isRuta1
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : isRuta2
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-slate-700 text-white shadow-xs'
                                    : isRuta1
                                    ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                                    : isRuta2
                                    ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                                onClick={() => { setRouteFilter(r); setSelectedInTab([]); }}
                              >
                                {label} ({count})
                              </Button>
                            );
                          })}
                        </div>

                        {/* Search input for conduces in tab */}
                        <div className="relative min-w-[170px] max-w-xs flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Buscar conduce o cliente..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setSelectedInTab([]); }}
                            className="w-full pl-8 pr-6 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-royal-blue"
                          />
                          {searchQuery && (
                            <button 
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px]"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Summary stats */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="bg-background p-2.5 rounded border shadow-xs flex-1 min-w-[90px]">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Conduces</p>
                          <p className="text-xl font-bold">{displayedConduces.length}</p>
                        </div>
                        <div className="bg-background p-2.5 rounded border shadow-xs flex-1 min-w-[90px]">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Bultos</p>
                          <p className="text-xl font-bold">{totalBultos}</p>
                        </div>
                        <div className="bg-background p-2.5 rounded border shadow-xs flex-1 min-w-[90px]">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Clientes</p>
                          <p className="text-xl font-bold">{totalClientes}</p>
                        </div>

                        {!isGeneralAlmacen && (
                          <div className="bg-background p-2.5 rounded border shadow-xs flex-1 min-w-[130px] flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Estado</p>
                              <p className="text-xs font-medium">
                                🚚 {camConduces.length} en camión | 📦 {whConduces.length} en almacén
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bulk actions for selected rows in tab */}
                      {selectedInTab.length > 0 && (
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded flex items-center justify-between text-xs animate-fade-in">
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                            {selectedInTab.length} conduc(es) seleccionado(s)
                          </span>
                          <div className="flex items-center gap-2">
                            {!isGeneralAlmacen && viewFilter !== 'almacen' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-50"
                                onClick={() => handleMoverSeleccionadosAAlmacen(enc)}
                                disabled={isTransferring}
                              >
                                <Warehouse className="h-3 w-3 mr-1 text-amber-600" />
                                Mover a {whName}
                              </Button>
                            )}

                            {(!isGeneralAlmacen && viewFilter !== 'camion') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
                                onClick={() => handleMoverSeleccionadosACamion(enc)}
                                disabled={isTransferring}
                              >
                                <Truck className="h-3 w-3 mr-1 text-blue-600" />
                                Mover a Camión {enc}
                              </Button>
                            )}

                            {isGeneralAlmacen && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setSelectedInTab([])}
                              >
                                Deseleccionar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conduces Table */}
                      {displayedConduces.length > 0 ? (
                        <div className="overflow-auto max-h-72 rounded border bg-background">
                          <Table>
                            <TableHeader className="bg-muted/40 sticky top-0 z-10 text-xs">
                              <TableRow>
                                <TableHead className="w-8 p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAll(displayedConduces)}
                                    className="p-0.5 rounded hover:bg-muted"
                                  >
                                    {selectedInTab.length === displayedConduces.length && displayedConduces.length > 0 ? (
                                      <CheckSquare className="h-3.5 w-3.5 text-royal-blue" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                </TableHead>
                                <TableHead className="font-bold">Conduce</TableHead>
                                <TableHead className="font-bold">Cliente / Destinatario</TableHead>
                                <TableHead className="font-bold">Ciudad</TableHead>
                                <TableHead className="font-bold text-center">Ruta</TableHead>
                                <TableHead className="font-bold text-center">Ubicación</TableHead>
                                <TableHead className="font-bold text-right">Bultos</TableHead>
                                <TableHead className="font-bold">Fecha Salida</TableHead>
                                <TableHead className="font-bold text-center">Prioridad</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                              {displayedConduces.map((conduce) => {
                                const isSelected = selectedInTab.includes(conduce.id);
                                const ruta = getConduceRoute(conduce);
                                const isWh = (conduce.encomendado || '').toLowerCase().includes('almacen');
                                const matchesToday = isGeneralAlmacen || coincideRutaConProgramacion(ruta, rutaHoy);

                                return (
                                  <TableRow 
                                    key={conduce.id} 
                                    className={`hover:bg-muted/40 cursor-pointer ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''}`}
                                    onClick={() => handleToggleSelectOne(conduce.id)}
                                  >
                                    <TableCell className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                      <Checkbox 
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleSelectOne(conduce.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-bold text-royal-blue dark:text-blue-400">
                                      {conduce.numeroConduce}
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-semibold">{conduce.razonSocial}</p>
                                        <span className="text-[10px] text-muted-foreground">Cód: {conduce.numeroCliente}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{conduce.ciudad || '-'}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-[10px] px-1.5 py-0 font-bold ${
                                          ruta === '1' ? 'border-blue-400 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30' :
                                          ruta === '2' ? 'border-amber-400 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30' :
                                          'border-slate-300 text-slate-600'
                                        }`}
                                      >
                                        {ruta ? `Ruta ${ruta}` : 'Sin ruta'}
                                      </Badge>
                                      {!matchesToday && !isWh && (
                                        <span className="block text-[9px] text-amber-600 font-medium">
                                          (No toca hoy)
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {isWh ? (
                                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/50 flex items-center gap-1 w-max mx-auto">
                                          <Warehouse className="h-2.5 w-2.5" />
                                          {conduce.encomendado}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 bg-blue-50 dark:bg-blue-950/50 flex items-center gap-1 w-max mx-auto">
                                          <Truck className="h-2.5 w-2.5" />
                                          Camión {conduce.encomendado}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-bold text-right">{conduce.cantidadBultos}</TableCell>
                                    <TableCell className="text-muted-foreground">{conduce.fechaEntrega}</TableCell>
                                    <TableCell className="text-center">
                                      {conduce.prioridad && (
                                        <Badge className="bg-red-500 text-white text-[10px]">Prioridad</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                          <p>
                            {routeFilter !== 'todas' || searchQuery
                              ? 'No se encontraron conduces con el filtro seleccionado.'
                              : isGeneralAlmacen 
                              ? 'No hay conduces en almacén.' 
                              : viewFilter === 'camion' 
                              ? 'No hay conduces asignados a este camión.' 
                              : viewFilter === 'almacen'
                              ? `No hay conduces en el almacén (${whName}).`
                              : 'No hay conduces para este encomendado.'}
                          </p>
                          {(routeFilter !== 'todas' || searchQuery) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => { setRouteFilter('todas'); setSearchQuery(''); }}
                            >
                              Limpiar filtros de búsqueda
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ConducesAsignados;
