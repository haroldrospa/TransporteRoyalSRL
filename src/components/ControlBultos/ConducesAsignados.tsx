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
  Search,
  ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProcessingOverlay from '@/components/cargar-camiones/ProcessingOverlay';
import { getRegionByTruck, getTruckWarehouse, getBaseTruck, isTruckWarehouse } from '@/utils/trucksByRegion';
import { clearUltraCache } from '@/services/conduces/ultraFastFetchConduces';
import { 
  ProgramacionSemanal, 
  getRutaProgramadaHoy, 
  coincideRutaConProgramacion, 
  transferirConducesAAlmacen, 
  transferirConducesACamion,
  asignarConducesConDivisionRuta,
  CAMIONES_DEFECTO
} from '@/services/rutasProgramacionService';

interface ConducesAsignadosProps {
  encomendadosList: string[];
  conduces?: Conduce[];
  loading: boolean;
  getConducesByEncomendado: (encomendado: string) => Conduce[];
  clientes: any[];
  refreshData?: () => void;
  programacion?: ProgramacionSemanal;
}

const ConducesAsignados = ({
  encomendadosList,
  conduces = [],
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

  // Reasignar conduces seleccionados en almacén al camión específico elegido
  const handleAsignarSeleccionadosACamion = async (camion: string) => {
    if (selectedInTab.length === 0) return;
    setIsTransferring(true);
    try {
      const base = getBaseTruck(camion);
      const res = await transferirConducesACamion(selectedInTab, base);
      if (res.success) {
        toast({
          title: "Conduces asignados",
          description: `${res.count} conduces asignados exitosamente a Camión ${base}.`,
        });
        setSelectedInTab([]);
        if (refreshData) refreshData();
      } else {
        toast({
          title: "Error",
          description: "No se pudieron asignar los conduces al camión.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Error al reasignar los conduces.",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Reasignar automáticamente los conduces seleccionados a sus respectivos camiones base
  const handleReasignarSeleccionadosACamionesBase = async (conducesPool: Conduce[]) => {
    if (selectedInTab.length === 0) return;
    setIsTransferring(true);
    try {
      const selectedConduces = conducesPool.filter(c => selectedInTab.includes(c.id));
      const grupos: Record<string, string[]> = {};
      const sinCamion: string[] = [];

      selectedConduces.forEach(c => {
        let base = getBaseTruck(c.encomendado);
        if (!base || base.toLowerCase() === 'almacen') {
          // Buscar predeterminado del cliente
          const cl = clientes.find(item => item.numeroCliente === c.numeroCliente);
          if (cl?.encomendado) {
            base = getBaseTruck(cl.encomendado);
          }
        }

        if (base && base.toLowerCase() !== 'almacen') {
          if (!grupos[base]) grupos[base] = [];
          grupos[base].push(c.id);
        } else {
          sinCamion.push(c.id);
        }
      });

      const updatePromises = Object.entries(grupos).map(([camion, ids]) =>
        transferirConducesACamion(ids, camion)
      );

      const results = await Promise.all(updatePromises);
      const totalMoved = results.reduce((sum, r) => sum + (r.success ? r.count : 0), 0);

      if (totalMoved > 0) {
        const detalles = Object.entries(grupos).map(([cam, ids]) => `${ids.length} a ${cam}`).join(', ');
        toast({
          title: "Conduces reasignados",
          description: `${totalMoved} conduces devueltos a sus camiones base (${detalles}).`,
        });
        setSelectedInTab([]);
        if (refreshData) refreshData();
      } else if (sinCamion.length > 0) {
        toast({
          title: "Sin camión base definido",
          description: "Los conduces seleccionados están en Almacén General y sus clientes no tienen camión predeterminado. Por favor use la opción 'Asignar a Camión...' para elegir el camión.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Error al reasignar los conduces a sus camiones.",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Reasignar un conduce individual a un camión
  const handleReasignarIndividual = async (conduceId: string, camion: string) => {
    if (!conduceId || !camion) return;
    setIsTransferring(true);
    try {
      const base = getBaseTruck(camion);
      const res = await transferirConducesACamion([conduceId], base);
      if (res.success) {
        toast({
          title: "Conduce asignado",
          description: `Conduce asignado a Camión ${base}.`,
        });
        setSelectedInTab(prev => prev.filter(id => id !== conduceId));
        if (refreshData) refreshData();
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // Dividir masivamente todos los conduces (Camiones y Almacén) según la programación de hoy
  const handleDividirTodosPorRuta = async () => {
    setIsTransferring(true);
    try {
      const trucks = encomendadosList.filter(t => t !== 'Almacen');
      let totalAMoverAlmacen = 0;
      let totalAMoverCamion = 0;

      // 1. De Camiones a Almacén: conduces que no corresponden a la ruta de hoy
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
          if (res.success) totalAMoverAlmacen += res.count;
        }
      }

      // 2. De Almacenes de Camión a Camión: conduces que SÍ corresponden a la ruta de hoy
      for (const t of trucks) {
        const baseTruck = getBaseTruck(t);
        const whName = getTruckWarehouse(baseTruck);
        const rutaHoy = getRutaProgramadaHoy(programacion, baseTruck);
        const whConduces = getConducesByEncomendado(whName);

        const aCargar = whConduces.filter(c => {
          const r = getConduceRoute(c);
          return coincideRutaConProgramacion(r, rutaHoy);
        });

        if (aCargar.length > 0) {
          const res = await transferirConducesACamion(aCargar.map(c => c.id), baseTruck);
          if (res.success) totalAMoverCamion += res.count;
        }
      }

      // 3. De Almacén General: auto-asignar con división de ruta según chofer predeterminado
      const generalConduces = getConducesByEncomendado('Almacen');
      if (generalConduces.length > 0) {
        const resAlmacen = await asignarConducesConDivisionRuta(
          generalConduces.map(c => c.id),
          'AUTO_CLIENTE',
          {
            conduces: generalConduces,
            clientes,
            programacion
          }
        );
        if (resAlmacen.success) {
          totalAMoverCamion += resAlmacen.enCamion;
          totalAMoverAlmacen += resAlmacen.enAlmacen;
        }
      }

      if (refreshData) await refreshData();

      const totalAfectados = totalAMoverAlmacen + totalAMoverCamion;
      if (totalAfectados > 0) {
        toast({
          title: "División masiva completada",
          description: `🚚 ${totalAMoverCamion} conduces cargados a camiones y 📦 ${totalAMoverAlmacen} movidos a almacén según la ruta de hoy.`,
        });
      } else {
        toast({
          title: "Todo al día",
          description: "Todos los conduces en camiones y almacenes coinciden con la ruta de hoy (o son Ruta 0).",
        });
      }
    } catch (err) {
      console.error('Error en división masiva:', err);
      toast({
        title: "Error",
        description: "No se pudieron dividir los conduces masivamente.",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Función para dividir los conduces de Almacén (General o por camión)
  const handleDividirAlmacen = async (targetConduces?: Conduce[]) => {
    setIsDividing(true);
    try {
      const allWh = encomendadosList
        .filter(t => t !== 'Almacen')
        .flatMap(t => getConducesByEncomendado(getTruckWarehouse(t)))
        .concat(getConducesByEncomendado('Almacen'));

      const conducesToDivide = targetConduces || (almacenTruckFilter === 'todos' 
        ? allWh 
        : almacenTruckFilter === 'general'
        ? getConducesByEncomendado('Almacen')
        : getConducesByEncomendado(almacenTruckFilter));

      if (conducesToDivide.length === 0) {
        toast({
          title: "Almacén vacío",
          description: "No hay conduces en almacén para dividir.",
        });
        return;
      }

      const res = await asignarConducesConDivisionRuta(
        conducesToDivide.map(c => c.id),
        'AUTO_CLIENTE',
        {
          conduces: conducesToDivide,
          clientes,
          programacion
        }
      );

      if (refreshData) await refreshData();

      toast({
        title: "División de almacén completada",
        description: res.mensaje || `🚚 ${res.enCamion} conduces asignados a camión y 📦 ${res.enAlmacen} en almacén.`,
      });
      setSelectedInTab([]);
    } catch (error) {
      console.error('Error dividiendo conduces de almacén:', error);
      toast({
        title: "Error",
        description: "No se pudieron dividir los conduces de almacén",
        variant: "destructive"
      });
    } finally {
      setIsDividing(false);
    }
  };

  // Dividir sólo los conduces seleccionados en Almacén
  const handleDividirSeleccionadosAlmacen = async (baseConduces: Conduce[]) => {
    const selected = baseConduces.filter(c => selectedInTab.includes(c.id));
    if (selected.length === 0) return;
    await handleDividirAlmacen(selected);
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
            className="h-8 text-xs font-semibold bg-royal-blue hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
            onClick={handleDividirTodosPorRuta}
            disabled={isTransferring || isDividing || loading}
            title="Dividir masivamente todos los conduces de camiones y almacén según la ruta de hoy"
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

                // Para la pestaña general de almacén: recopilar TODOS los conduces que están en almacén
                const allWarehouseConduces = isGeneralAlmacen
                  ? (conduces && conduces.length > 0
                      ? conduces.filter(c => c.encomendado && (c.encomendado.toLowerCase().includes('almacen') || isTruckWarehouse(c.encomendado)))
                      : encomendadosList
                          .filter(t => t !== 'Almacen')
                          .flatMap(t => getConducesByEncomendado(getTruckWarehouse(t)))
                          .concat(whConduces)
                    )
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
                    baseConduces = allWarehouseConduces.filter(c => (c.encomendado || '').trim().toLowerCase() === 'almacen');
                  } else {
                    const cleanFilter = almacenTruckFilter.trim().toUpperCase().replace(/[-_]/g, '');
                    baseConduces = allWarehouseConduces.filter(c => {
                      const cleanC = (c.encomendado || '').trim().toUpperCase().replace(/[-_]/g, '');
                      return cleanC === cleanFilter;
                    });
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
                              <option value="general">
                                Almacén General ({allWarehouseConduces.filter(c => (c.encomendado || '').trim().toLowerCase() === 'almacen').length})
                              </option>
                              {Array.from(new Set([
                                ...allWarehouseConduces.map(c => c.encomendado!).filter(Boolean),
                                ...encomendadosList.filter(t => t !== 'Almacen').map(t => getTruckWarehouse(t))
                              ])).filter(w => w.toLowerCase() !== 'almacen').sort().map(tWh => {
                                const cleanTarget = tWh.trim().toUpperCase().replace(/[-_]/g, '');
                                const count = allWarehouseConduces.filter(c => {
                                  const cleanC = (c.encomendado || '').trim().toUpperCase().replace(/[-_]/g, '');
                                  return cleanC === cleanTarget;
                                }).length;
                                const base = getBaseTruck(tWh);
                                return (
                                  <option key={tWh} value={tWh}>
                                    {tWh} - Almacén {base || tWh} ({count})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {baseConduces.length > 0 && (
                            <Button 
                              onClick={() => handleDividirAlmacen(baseConduces)}
                              className="bg-royal-blue hover:bg-blue-700 text-white h-8 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                              size="sm"
                              disabled={isDividing || isTransferring}
                              title="Carga a camiones los conduces que coinciden con la ruta de hoy y organiza el almacén"
                            >
                              <GitBranch className="h-3.5 w-3.5 mr-1" />
                              Dividir Almacén por Ruta de Hoy ({baseConduces.length})
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
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                            {selectedInTab.length} conduc(es) seleccionado(s)
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
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
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                                  onClick={() => handleReasignarSeleccionadosACamionesBase(baseConduces)}
                                  disabled={isTransferring || isDividing}
                                  title="Devuelve cada conduce a su camión original (R03-Almacen -> R-03, R05-Almacen -> R-05, etc.)"
                                >
                                  <Truck className="h-3.5 w-3.5 mr-1" />
                                  Cargar a Camiones Base ({selectedInTab.length})
                                </Button>

                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-royal-blue hover:bg-blue-700 text-white font-semibold shadow-xs"
                                  onClick={() => handleDividirSeleccionadosAlmacen(baseConduces)}
                                  disabled={isTransferring || isDividing}
                                  title="Divide los conduces seleccionados según la programación de ruta de hoy"
                                >
                                  <GitBranch className="h-3.5 w-3.5 mr-1" />
                                  Dividir por Ruta ({selectedInTab.length})
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold"
                                      disabled={isTransferring}
                                    >
                                      <Truck className="h-3.5 w-3.5 mr-1 text-blue-600" />
                                      Asignar a Camión...
                                      <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-y-auto text-xs">
                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold py-1">
                                      Asignar {selectedInTab.length} conduc(es) a:
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {CAMIONES_DEFECTO.map(t => (
                                      <DropdownMenuItem
                                        key={t.camion}
                                        onClick={() => handleAsignarSeleccionadosACamion(t.camion)}
                                        className="cursor-pointer text-xs flex items-center justify-between py-1.5"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                          <span className="font-bold">{t.camion}</span>
                                          <span className="text-[11px] text-muted-foreground truncate">{t.chofer}</span>
                                        </div>
                                        <span className="text-[9px] px-1 py-0 rounded bg-muted text-muted-foreground shrink-0">{t.region}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => setSelectedInTab([])}
                                >
                                  Deseleccionar
                                </Button>
                              </>
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
                                <TableHead className="font-bold text-center">Acción</TableHead>
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
                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                      {isWh ? (
                                        <div className="flex items-center justify-center gap-1">
                                          {(() => {
                                            const base = getBaseTruck(conduce.encomendado);
                                            const hasSpecificBase = base && base.toLowerCase() !== 'almacen';
                                            return (
                                              <>
                                                {hasSpecificBase && (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 px-1.5 text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 flex items-center gap-1 font-semibold"
                                                    onClick={() => handleReasignarIndividual(conduce.id, base)}
                                                    disabled={isTransferring}
                                                    title={`Cargar directamente al camión ${base}`}
                                                  >
                                                    <Truck className="h-2.5 w-2.5 text-emerald-600" />
                                                    Cargar a {base}
                                                  </Button>
                                                )}

                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-6 px-1.5 text-[10px] text-slate-700 hover:text-blue-700 flex items-center gap-0.5"
                                                      disabled={isTransferring}
                                                      title="Asignar a otro camión..."
                                                    >
                                                      <Truck className="h-2.5 w-2.5 text-blue-600" />
                                                      {!hasSpecificBase ? 'Asignar' : ''}
                                                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto text-xs">
                                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold py-1">
                                                      Asignar Conduce a:
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {CAMIONES_DEFECTO.map(t => (
                                                      <DropdownMenuItem
                                                        key={t.camion}
                                                        onClick={() => handleReasignarIndividual(conduce.id, t.camion)}
                                                        className="cursor-pointer text-xs py-1.5 flex items-center justify-between"
                                                      >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                          <Truck className="h-3 w-3 text-blue-600 shrink-0" />
                                                          <span className="font-bold">{t.camion}</span>
                                                          <span className="text-[10px] text-muted-foreground truncate">{t.chofer}</span>
                                                        </div>
                                                        <span className="text-[9px] px-1 rounded bg-muted text-muted-foreground">{t.region}</span>
                                                      </DropdownMenuItem>
                                                    ))}
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-1.5 text-[10px] text-amber-700 hover:bg-amber-50 flex items-center gap-1 mx-auto"
                                          onClick={() => handleMoverRutasNoHoy(enc, [conduce], whName, rutaHoy)}
                                          disabled={isTransferring}
                                          title={`Mover a ${whName}`}
                                        >
                                          <Warehouse className="h-2.5 w-2.5" />
                                          Almacén
                                        </Button>
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
