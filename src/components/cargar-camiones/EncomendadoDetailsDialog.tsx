import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  FlaskConical, 
  Pill, 
  Beaker, 
  Microscope,
  Search,
  XCircle,
  Truck
} from 'lucide-react';
import { Conduce } from '@/types/conduces';

interface EncomendadoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encomendado: string | null;
  verifiedShipments: any[];
  assignedConduces: Conduce[];
}

const EncomendadoDetailsDialog = ({
  open,
  onOpenChange,
  encomendado,
  verifiedShipments,
  assignedConduces
}: EncomendadoDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [labFilter, setLabFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const cleanTarget = (encomendado || '').trim().toUpperCase().replace(/[-_]/g, '');

  // Filtrar conduces para este encomendado (insensible a guiones y mayúsculas)
  const truckConduces = useMemo(() => {
    if (!encomendado) return [];
    return assignedConduces.filter(c => {
      if (!c.encomendado) return false;
      const cleanC = c.encomendado.trim().toUpperCase().replace(/[-_]/g, '');
      return cleanC === cleanTarget;
    });
  }, [assignedConduces, cleanTarget, encomendado]);

  // Obtener shipments verificados para este camión/almacén
  const truckShipments = useMemo(() => {
    if (!encomendado) return [];
    return verifiedShipments.filter(s => {
      if (!s.encomendado) return false;
      const cleanS = s.encomendado.trim().toUpperCase().replace(/[-_]/g, '');
      return cleanS === cleanTarget;
    });
  }, [verifiedShipments, cleanTarget, encomendado]);

  // Obtener conduces escaneados y bultos escaneados por separado
  const { scannedConduceNumbers, scannedBultosByConduce } = useMemo(() => {
    const numbers = new Set<string>();
    const bultosMap: Record<string, number> = {};

    truckShipments.forEach(s => {
      if (s.scan_type === 'conduce' && s.conduce_number) {
        numbers.add(s.conduce_number);
      }
      if (s.scan_type === 'bulto' && s.conduce_number) {
        bultosMap[s.conduce_number] = (bultosMap[s.conduce_number] || 0) + 1;
      }
    });

    return { scannedConduceNumbers: numbers, scannedBultosByConduce: bultosMap };
  }, [truckShipments]);

  // Procesar todos los conduces
  const processedConduces = useMemo(() => {
    return truckConduces.map(conduce => {
      const scannedBultos = scannedBultosByConduce[conduce.numeroConduce] || 0;
      const conduceScanned = scannedConduceNumbers.has(conduce.numeroConduce);
      const totalBultos = conduce.cantidadBultos || 0;
      const missingBultos = Math.max(0, totalBultos - scannedBultos);
      const isCompleted = conduceScanned && scannedBultos >= totalBultos;

      return {
        conduce,
        conduceScanned,
        scannedBultos,
        totalBultos,
        missingBultos,
        isCompleted
      };
    });
  }, [truckConduces, scannedConduceNumbers, scannedBultosByConduce]);

  // Configuración de laboratorios conocidos
  const labConfig = [
    { key: 'LAM', label: 'LAM', icon: Beaker },
    { key: 'Fersuaz', label: 'Fersuaz', icon: FlaskConical },
    { key: 'Taapharmaceutica', label: 'Taapharma', icon: Pill },
    { key: 'Innovacion Quimica', label: 'Innov. Química', icon: Beaker },
    { key: 'Krishpar Care Dominicana', label: 'Krishpar', icon: Microscope },
  ];

  // Stats por laboratorio
  const labStats = useMemo(() => {
    const labsPresent = new Set(processedConduces.map(i => i.conduce.laboratorio).filter(Boolean));
    
    return labConfig
      .map(lab => {
        const labItems = processedConduces.filter(item => {
          if (lab.key === 'Krishpar Care Dominicana') {
            return (
              item.conduce.laboratorio === 'Krishpar Care Dominicana' ||
              item.conduce.laboratorio === 'Krishpar care dominicana'
            );
          }
          return item.conduce.laboratorio === lab.key;
        });

        const totalConduces = labItems.length;
        const totalBultos = labItems.reduce((acc, item) => acc + item.totalBultos, 0);
        const scannedBultos = labItems.reduce((acc, item) => acc + item.scannedBultos, 0);
        const scannedConducesCount = labItems.filter(item => item.conduceScanned).length;

        return {
          ...lab,
          totalConduces,
          totalBultos,
          scannedBultos,
          scannedConducesCount
        };
      })
      .filter(s => s.totalConduces > 0);
  }, [processedConduces]);

  // Totales generales
  const grandTotalBultos = useMemo(
    () => processedConduces.reduce((acc, i) => acc + i.totalBultos, 0),
    [processedConduces]
  );
  const grandScannedBultos = useMemo(
    () => processedConduces.reduce((acc, i) => acc + i.scannedBultos, 0),
    [processedConduces]
  );
  const grandScannedConduces = useMemo(
    () => processedConduces.filter(i => i.conduceScanned).length,
    [processedConduces]
  );

  // Filtrar según el tab, el laboratorio seleccionado y el término de búsqueda
  const filteredConduces = useMemo(() => {
    return processedConduces.filter(item => {
      // Filtro de pestaña
      if (activeTab === 'pending' && item.isCompleted) return false;
      if (activeTab === 'completed' && !item.isCompleted) return false;

      // Filtro de laboratorio
      if (labFilter) {
        if (labFilter === 'Krishpar Care Dominicana') {
          const isKrishpar =
            item.conduce.laboratorio === 'Krishpar Care Dominicana' ||
            item.conduce.laboratorio === 'Krishpar care dominicana';
          if (!isKrishpar) return false;
        } else if (item.conduce.laboratorio !== labFilter) {
          return false;
        }
      }

      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const num = (item.conduce.numeroConduce || '').toLowerCase();
        const client = (item.conduce.razonSocial || '').toLowerCase();
        const city = (item.conduce.ciudad || '').toLowerCase();
        if (!num.includes(query) && !client.includes(query) && !city.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [processedConduces, activeTab, labFilter, searchTerm]);

  const pendingCount = useMemo(
    () => processedConduces.filter(i => !i.isCompleted).length,
    [processedConduces]
  );
  const completedCount = useMemo(
    () => processedConduces.filter(i => i.isCompleted).length,
    [processedConduces]
  );

  const conducesPercent = truckConduces.length > 0 
    ? Math.round((grandScannedConduces / truckConduces.length) * 100) 
    : 0;

  const bultosPercent = grandTotalBultos > 0 
    ? Math.round((grandScannedBultos / grandTotalBultos) * 100) 
    : 0;

  if (!open || !encomendado) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[calc(100vw-1rem)] sm:w-full max-h-[90vh] p-4 sm:p-6 flex flex-col gap-4 overflow-hidden rounded-xl">
        {/* Cabecera limpia y clara */}
        <DialogHeader className="shrink-0 pb-1 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-royal-blue/10 text-royal-blue">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Detalles de {encomendado}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Control de carga y verificación de escaneo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
                {truckConduces.length} conduces
              </Badge>
              <Badge variant="outline" className="font-semibold text-xs px-2.5 py-0.5">
                {grandTotalBultos} bultos
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Tarjetas de Laboratorios (Filtros interactivos limpios) */}
          {labStats.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Laboratorios en esta ruta
                </span>
                {labFilter && (
                  <button
                    type="button"
                    onClick={() => setLabFilter(null)}
                    className="text-xs text-royal-blue hover:underline font-medium"
                  >
                    Mostrar todos
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {labStats.map(lab => {
                  const Icon = lab.icon;
                  const isSelected = labFilter === lab.key;
                  const isLabComplete = 
                    lab.scannedConducesCount === lab.totalConduces && 
                    lab.scannedBultos === lab.totalBultos;

                  return (
                    <button
                      key={lab.key}
                      type="button"
                      onClick={() => setLabFilter(isSelected ? null : lab.key)}
                      className={`w-full text-left rounded-xl p-3 transition-all border outline-none ${
                        isSelected
                          ? 'bg-blue-50/80 border-royal-blue shadow-xs ring-2 ring-royal-blue/20'
                          : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {/* Cabecera: Ícono + Nombre + Estado */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-royal-blue text-white' : 'bg-slate-100 text-slate-700'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-sm text-foreground truncate">
                            {lab.label}
                          </span>
                        </div>

                        {isLabComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Listo
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                            Pendiente
                          </span>
                        )}
                      </div>

                      {/* Cajitas de estadísticas ordenadas */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100/90">
                          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Conduces</p>
                          <p className={`font-bold text-sm mt-0.5 ${lab.scannedConducesCount === lab.totalConduces ? 'text-emerald-700' : 'text-foreground'}`}>
                            {lab.scannedConducesCount} <span className="text-muted-foreground font-normal text-xs">/ {lab.totalConduces}</span>
                          </p>
                        </div>

                        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100/90">
                          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Bultos</p>
                          <p className={`font-bold text-sm mt-0.5 ${lab.scannedBultos === lab.totalBultos ? 'text-emerald-700' : 'text-foreground'}`}>
                            {lab.scannedBultos} <span className="text-muted-foreground font-normal text-xs">/ {lab.totalBultos}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumen Total General */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-royal-blue shrink-0" />
              <span className="font-bold text-xs sm:text-sm text-foreground">
                Total General
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-200">
                <span className="text-muted-foreground">Conduces:</span>
                <span className="font-bold text-foreground">
                  {grandScannedConduces} / {truckConduces.length}
                </span>
                <span className={`text-[10px] font-semibold px-1 rounded ${conducesPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {conducesPercent}%
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-200">
                <span className="text-muted-foreground">Bultos:</span>
                <span className="font-bold text-foreground">
                  {grandScannedBultos} / {grandTotalBultos}
                </span>
                <span className={`text-[10px] font-semibold px-1 rounded ${bultosPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {bultosPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Selector de pestañas + Buscador */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as 'pending' | 'completed')}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-2 w-full sm:w-72 h-9">
                  <TabsTrigger value="pending" className="text-xs font-semibold gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Pendientes ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs font-semibold gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Completados ({completedCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Buscador rápido */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar conduce o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Lista unificada y limpia de Conduces */}
            {filteredConduces.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                {activeTab === 'pending' ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-emerald-700">
                      ¡Todos los conduces y bultos están completos!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No hay elementos pendientes para este filtro.
                    </p>
                  </>
                ) : (
                  <>
                    <Package className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-600">
                      No hay conduces completados aún
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Los conduces y sus bultos escaneados aparecerán aquí.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredConduces.map(item => {
                  const { conduce, conduceScanned, scannedBultos, totalBultos, missingBultos } = item;
                  const isBultosDone = missingBultos === 0 && totalBultos > 0;

                  return (
                    <div
                      key={conduce.id}
                      className="bg-white border border-slate-200/90 rounded-lg p-3 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Información Principal del Conduce */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-royal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {conduce.numeroConduce}
                          </span>
                          {conduce.laboratorio && (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {conduce.laboratorio}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-foreground truncate">
                          {conduce.razonSocial || 'Cliente sin nombre'}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {conduce.ciudad && <span>📍 {conduce.ciudad}</span>}
                          {conduce.fechaCarga && <span>📅 Cargado: {conduce.fechaCarga}</span>}
                        </div>
                      </div>

                      {/* Estado claro de Conduce y Bultos */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Estado del Conduce Físico */}
                        {conduceScanned ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold hover:bg-emerald-50">
                            ✓ Conduce escaneado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 text-xs font-semibold hover:bg-red-100">
                            Falta escanear conduce
                          </Badge>
                        )}

                        {/* Estado de los Bultos */}
                        {isBultosDone ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                            ✓ {scannedBultos}/{totalBultos} bultos listos
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs font-semibold">
                            {scannedBultos}/{totalBultos} bultos (faltan {missingBultos})
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EncomendadoDetailsDialog;
