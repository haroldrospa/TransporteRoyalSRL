import { Conduce } from '@/types/conduces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, AlertTriangle, Maximize, Minimize, FileText, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMemo, useState } from 'react';

interface MissingItemsDisplayProps {
  conduces: Conduce[];
  scannedConduces: Record<string, string[]>;
  scannedBultos: Record<string, number>;
  scannedBultoIds: Record<string, string[]>;
  loading?: boolean;
}

const MissingItemsDisplay = ({
  conduces,
  scannedConduces,
  scannedBultos,
  scannedBultoIds,
  loading = false
}: MissingItemsDisplayProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Global scanned sets
  const scannedConduceSet = useMemo(() => {
    return new Set(Object.values(scannedConduces).flat());
  }, [scannedConduces]);

  const scannedBultosByConduce = useMemo(() => {
    const map: Record<string, number> = {};
    const allIds = Object.values(scannedBultoIds).flat();

    allIds.forEach((id) => {
      const conduceNumber = id.split('-')[0];
      if (!conduceNumber) return;
      map[conduceNumber] = (map[conduceNumber] || 0) + 1;
    });

    return map;
  }, [scannedBultoIds]);

  // Filter assigned conduces in transit
  const assignedConduces = useMemo(() => {
    return conduces.filter(c => c.encomendado && c.estado === 'En tránsito');
  }, [conduces]);

  // Calculate missing conduces and pending bultos separated cleanly
  const { allMissingConduces, allPendingBultos, availableTrucks } = useMemo(() => {
    const missingConds: Array<{ conduce: Conduce; truck: string }> = [];
    const pendingBults: Array<{
      conduce: Conduce;
      truck: string;
      scannedBultos: number;
      totalBultos: number;
      missingBultos: number;
    }> = [];

    const trucksSet = new Set<string>();

    assignedConduces.forEach(conduce => {
      const truck = conduce.encomendado || 'Sin Asignar';
      trucksSet.add(truck);

      // Check if conduce is unscanned
      if (!scannedConduceSet.has(conduce.numeroConduce)) {
        missingConds.push({ conduce, truck });
      }

      // Check if bultos are incomplete
      const scannedCount = scannedBultosByConduce[conduce.numeroConduce] || 0;
      const totalCount = conduce.cantidadBultos || 0;
      const missing = Math.max(0, totalCount - scannedCount);

      if (missing > 0) {
        pendingBults.push({
          conduce,
          truck,
          scannedBultos: scannedCount,
          totalBultos: totalCount,
          missingBultos: missing
        });
      }
    });

    return {
      allMissingConduces: missingConds,
      allPendingBultos: pendingBults,
      availableTrucks: Array.from(trucksSet).sort()
    };
  }, [assignedConduces, scannedConduceSet, scannedBultosByConduce]);

  const totalMissingConduces = allMissingConduces.length;
  const totalMissingBultos = allPendingBultos.reduce((sum, item) => sum + item.missingBultos, 0);
  const hasMissingItems = totalMissingConduces > 0 || totalMissingBultos > 0;

  // Filtered Conduces by truck & search
  const filteredConduces = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return allMissingConduces.filter(({ conduce, truck }) => {
      if (selectedTruck !== 'all' && truck !== selectedTruck) return false;
      if (search) {
        const matchNumber = conduce.numeroConduce?.toLowerCase().includes(search);
        const matchClient = conduce.razonSocial?.toLowerCase().includes(search);
        const matchLab = conduce.laboratorio?.toLowerCase().includes(search);
        if (!matchNumber && !matchClient && !matchLab) return false;
      }
      return true;
    });
  }, [allMissingConduces, selectedTruck, searchTerm]);

  // Filtered Bultos by truck & search
  const filteredPendingBultos = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return allPendingBultos.filter(({ conduce, truck }) => {
      if (selectedTruck !== 'all' && truck !== selectedTruck) return false;
      if (search) {
        const matchNumber = conduce.numeroConduce?.toLowerCase().includes(search);
        const matchClient = conduce.razonSocial?.toLowerCase().includes(search);
        const matchLab = conduce.laboratorio?.toLowerCase().includes(search);
        if (!matchNumber && !matchClient && !matchLab) return false;
      }
      return true;
    });
  }, [allPendingBultos, selectedTruck, searchTerm]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Header Minimalista */}
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Items pendientes por escanear
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Control en tiempo real de conduces y bultos asignados en tránsito
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasMissingItems && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                    <FileText className="h-3 w-3" />
                    {totalMissingConduces} conduces
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                    <Package className="h-3 w-3" />
                    {totalMissingBultos} bultos
                  </span>
                </div>
              )}

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                  {isOpen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  <span className="sr-only">{isOpen ? 'Minimizar' : 'Maximizar'}</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        {/* Contenido Desplegable */}
        <CollapsibleContent>
          <CardContent className="p-4 sm:p-5">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-2">
                <div className="h-44 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="h-44 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
              </div>
            ) : !hasMissingItems ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">¡Todo al día!</h4>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  Todos los conduces y bultos asignados en tránsito han sido verificados y escaneados correctamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Barra superior de controles: Camión y Búsqueda */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {/* Selector de Camiones en píldoras */}
                  {availableTrucks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium mr-1">Camión:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTruck('all')}
                        className={`!inline-flex items-center px-3 py-1 rounded-full text-xs transition-colors ${
                          selectedTruck === 'all'
                            ? 'bg-slate-900 text-white font-medium shadow-xs dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Todos ({availableTrucks.length})
                      </button>
                      {availableTrucks.map(truck => (
                        <button
                          key={truck}
                          type="button"
                          onClick={() => setSelectedTruck(truck)}
                          className={`!inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
                            selectedTruck === truck
                              ? 'bg-slate-900 text-white font-medium shadow-xs dark:bg-slate-100 dark:text-slate-900'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <Truck className="h-3 w-3 opacity-70" />
                          <span>{truck}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Búsqueda rápida */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial ml-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por conduce, cliente..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* DOS PANELES SEPARADOS (CONDUCES APARTE Y BULTOS APARTE) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* PANEL 1: CONDUCES PENDIENTES */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                    {/* Cabecera de Conduces */}
                    <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Conduces Pendientes
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                        {filteredConduces.length}
                      </span>
                    </div>

                    {/* Lista de Conduces */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[440px] overflow-y-auto">
                      {filteredConduces.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          ✓ No hay conduces pendientes por escanear
                        </div>
                      ) : (
                        filteredConduces.map(({ conduce, truck }) => (
                          <div
                            key={conduce.id}
                            className="px-3.5 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                                {conduce.numeroConduce}
                              </span>
                              {conduce.laboratorio && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                  {conduce.laboratorio}
                                </span>
                              )}
                              <span className="text-slate-600 dark:text-slate-300 truncate">
                                {conduce.razonSocial || 'Sin nombre'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {conduce.fechaCarga && (
                                <span className="text-slate-400 text-[11px] whitespace-nowrap hidden sm:inline">
                                  📅 {conduce.fechaCarga}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {conduce.cantidadBultos || 0} B
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PANEL 2: BULTOS PENDIENTES */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                    {/* Cabecera de Bultos */}
                    <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Bultos Pendientes
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                        {filteredPendingBultos.reduce((sum, i) => sum + i.missingBultos, 0)} bultos
                      </span>
                    </div>

                    {/* Lista de Bultos */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[440px] overflow-y-auto">
                      {filteredPendingBultos.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          ✓ No hay bultos pendientes por escanear
                        </div>
                      ) : (
                        filteredPendingBultos.map(({ conduce, scannedBultos, totalBultos, missingBultos, truck }) => (
                          <div
                            key={conduce.id}
                            className="px-3.5 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                                {conduce.numeroConduce}
                              </span>
                              {conduce.laboratorio && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                  {conduce.laboratorio}
                                </span>
                              )}
                              <span className="text-slate-600 dark:text-slate-300 truncate">
                                {conduce.razonSocial || 'Sin nombre'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                                {scannedBultos}/{totalBultos} <span className="text-rose-600 dark:text-rose-400 font-bold">• Falta {missingBultos}</span>
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>

        {/* Resumen cuando está colapsado */}
        {!isOpen && hasMissingItems && (
          <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Pendientes:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {totalMissingConduces} conduces
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {totalMissingBultos} bultos
            </span>
          </div>
        )}
      </Card>
    </Collapsible>
  );
};

export default MissingItemsDisplay;
