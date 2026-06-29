
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, FileText, AlertTriangle, CheckCircle, FlaskConical, Pill, Beaker } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState("pending");
  const [labFilter, setLabFilter] = useState<string | null>(null);
  const [showLabConduces, setShowLabConduces] = useState(false);

  if (!encomendado) return null;

  // Filtrar conduces para este encomendado
  const truckConduces = assignedConduces.filter(
    c => c.encomendado === encomendado
  );

  // Obtener shipments verificados para este camión
  const truckShipments = verifiedShipments.filter(
    s => s.encomendado === encomendado
  );

  // Obtener conduces escaneados y bultos escaneados por separado
  const scannedConduceNumbers = truckShipments
    .filter(s => s.scan_type === 'conduce')
    .map(s => s.conduce_number);

  // Crear mapa de bultos escaneados por conduce
  const scannedBultosByConduce = truckShipments
    .filter(s => s.scan_type === 'bulto')
    .reduce((acc, shipment) => {
      if (!acc[shipment.conduce_number]) {
        acc[shipment.conduce_number] = 0;
      }
      acc[shipment.conduce_number]++;
      return acc;
    }, {} as Record<string, number>);

  // Procesar todos los conduces para mostrar su estado independientemente
  const processedConduces = truckConduces.map(conduce => {
    const scannedBultos = scannedBultosByConduce[conduce.numeroConduce] || 0;
    const conduceScanned = scannedConduceNumbers.includes(conduce.numeroConduce);
    const missingBultos = conduce.cantidadBultos - scannedBultos;
    
    return {
      conduce,
      conduceScanned,
      scannedBultos,
      totalBultos: conduce.cantidadBultos,
      missingBultos,
      isCompleted: conduceScanned && scannedBultos === conduce.cantidadBultos
    };
  });

  // Separar por estado
  const pendingConduces = processedConduces.filter(item => 
    !item.conduceScanned || item.missingBultos > 0
  );
  
  const completedConduces = processedConduces.filter(item => item.isCompleted);

  const totalPending = pendingConduces.length;

  // Stats por laboratorio
  const labConfig = [
    { key: 'LAM', label: 'LAM', icon: Beaker, color: 'purple' },
    { key: 'Fersuaz', label: 'Fersuaz', icon: FlaskConical, color: 'teal' },
    { key: 'Taapharmaceutica', label: 'Taapharma', icon: Pill, color: 'amber' },
    { key: 'Innovacion Quimica', label: 'Innov. Quimica', icon: Beaker, color: 'green' },
  ] as const;

  const labStats = labConfig.map(lab => {
    const labItems = processedConduces.filter(item => item.conduce.laboratorio === lab.key);
    const totalConduces = labItems.length;
    const totalBultos = labItems.reduce((acc, item) => acc + item.totalBultos, 0);
    const scannedBultos = labItems.reduce((acc, item) => acc + item.scannedBultos, 0);
    const scannedConducesCount = labItems.filter(item => item.conduceScanned).length;
    return { ...lab, totalConduces, totalBultos, scannedBultos, scannedConducesCount };
  }).filter(s => s.totalConduces > 0);

  const grandTotalBultos = processedConduces.reduce((acc, i) => acc + i.totalBultos, 0);
  const grandScannedBultos = processedConduces.reduce((acc, i) => acc + i.scannedBultos, 0);
  const grandScannedConduces = processedConduces.filter(i => i.conduceScanned).length;

  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };
  const iconBgClasses: Record<string, string> = {
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100vw-1rem)] sm:w-full max-h-[92vh] p-3 sm:p-6 flex flex-col gap-3 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
            Detalles de {encomendado}
            <Badge variant="outline" className="text-xs">
              {truckConduces.length} conduces
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-3">
        {labStats.length > 0 && (
          <div className="space-y-2">
            <div className={`grid gap-2 ${labStats.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {labStats.map(lab => {
                const Icon = lab.icon;
                const isActive = showLabConduces && labFilter === lab.key;
                return (
                  <button
                    key={lab.key}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setShowLabConduces(false);
                        setLabFilter(null);
                      } else {
                        setLabFilter(lab.key);
                        setShowLabConduces(true);
                      }
                    }}
                    className={`text-left rounded-lg border p-2 sm:p-3 transition-all hover:shadow-md ${colorClasses[lab.color]} ${isActive ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full ${iconBgClasses[lab.color]}`}>
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                      <span className="font-semibold text-[11px] sm:text-sm truncate">{lab.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
                      <div>
                        <p className="opacity-70 leading-tight">Conduces</p>
                        <p className="font-bold text-sm sm:text-base leading-tight">{lab.scannedConducesCount}/{lab.totalConduces}</p>
                      </div>
                      <div>
                        <p className="opacity-70 leading-tight">Bultos</p>
                        <p className="font-bold text-sm sm:text-base leading-tight">{lab.scannedBultos}/{lab.totalBultos}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-semibold text-xs sm:text-sm">Total general</span>
              </div>
              <div className="flex gap-3 text-xs sm:text-sm">
                <span><span className="text-muted-foreground">Conduces:</span> <strong>{grandScannedConduces}/{truckConduces.length}</strong></span>
                <span><span className="text-muted-foreground">Bultos:</span> <strong className="text-primary">{grandScannedBultos}/{grandTotalBultos}</strong></span>
              </div>
            </div>

            {showLabConduces && labFilter && (() => {
              const labItems = processedConduces.filter(i => i.conduce.laboratorio === labFilter);
              const labMeta = labConfig.find(l => l.key === labFilter);
              return (
                <div className={`rounded-lg border p-2 sm:p-3 ${labMeta ? colorClasses[labMeta.color] : ''}`}>
                  <div className="flex items-center justify-between mb-2 sticky top-0 bg-inherit pb-2">
                    <h4 className="font-semibold text-sm">Conduces de {labMeta?.label}</h4>
                    <Badge variant="outline" className="text-xs">{labItems.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {labItems.map(item => {
                      const { conduce, scannedBultos, totalBultos, isCompleted, conduceScanned } = item;
                      return (
                        <div key={conduce.id} className="bg-white/70 rounded-md p-2 border border-white">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold">{conduce.numeroConduce}</span>
                                {isCompleted ? (
                                  <Badge className="bg-green-600 text-[10px] h-4 px-1.5">✓</Badge>
                                ) : !conduceScanned ? (
                                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Sin escanear</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-300">Bultos: {scannedBultos}/{totalBultos}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-foreground/80 truncate">{conduce.razonSocial}</p>
                              {conduce.ciudad && (
                                <p className="text-[11px] text-muted-foreground">📍 {conduce.ciudad}</p>
                              )}
                            </div>
                            <div className="text-right text-xs">
                              <span className="font-semibold">{scannedBultos}/{totalBultos}</span>
                              <p className="text-[10px] text-muted-foreground">bultos</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Pendientes ({totalPending})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Completados ({completedConduces.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-3">
            {totalPending === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-600 font-medium">
                  Todos los conduces y bultos han sido escaneados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Columna de Conduces Pendientes */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-700 flex items-center gap-2 border-b pb-1.5 text-sm">
                    <FileText className="h-4 w-4" />
                    Conduces Pendientes
                    <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {pendingConduces.filter(item => !item.conduceScanned).length}
                    </Badge>
                  </h3>
                  
                  <div className="space-y-1.5">
                    {pendingConduces
                      .filter(item => !item.conduceScanned)
                      .map((item) => {
                        const { conduce, scannedBultos, totalBultos } = item;
                        return (
                          <div 
                            key={`conduce-${conduce.id}`} 
                            className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5"
                          >
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <span className="font-mono text-xs sm:text-sm font-semibold text-blue-800 truncate">
                                {conduce.numeroConduce}
                              </span>
                              <Badge variant="destructive" className="text-[10px] h-4 px-1.5 shrink-0">
                                Sin escanear
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 truncate">{conduce.razonSocial}</p>
                            {conduce.ciudad && (
                              <p className="text-[11px] text-gray-500">📍 {conduce.ciudad}</p>
                            )}
                            {conduce.fechaCarga && (
                              <p className="text-[11px] text-gray-500">📅 Cargado: {conduce.fechaCarga}</p>
                            )}
                            {scannedBultos > 0 && (
                              <p className="text-[11px] text-amber-600 mt-0.5">
                                • {scannedBultos}/{totalBultos} bultos escaneados
                              </p>
                            )}
                          </div>
                        );
                      })}
                    
                    {pendingConduces.filter(item => !item.conduceScanned).length === 0 && (
                      <div className="text-center py-3 text-green-600 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs">Todos los conduces escaneados</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna de Bultos Pendientes */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-amber-700 flex items-center gap-2 border-b pb-1.5 text-sm">
                    <Package className="h-4 w-4" />
                    Bultos Pendientes
                    <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200 text-xs">
                      {pendingConduces.reduce((acc, item) => acc + item.missingBultos, 0)}
                    </Badge>
                  </h3>
                  
                  <div className="space-y-1.5">
                    {pendingConduces
                      .filter(item => item.missingBultos > 0)
                      .map((item) => {
                        const { conduce, scannedBultos, totalBultos, missingBultos, conduceScanned } = item;
                        return (
                          <div 
                            key={`bulto-${conduce.id}`} 
                            className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-2.5"
                          >
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <span className="font-mono text-xs sm:text-sm font-semibold text-amber-800 truncate">
                                {conduce.numeroConduce}
                              </span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-300 shrink-0">
                                {scannedBultos}/{totalBultos}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 truncate">{conduce.razonSocial}</p>
                            {conduce.ciudad && (
                              <p className="text-[11px] text-gray-500">📍 {conduce.ciudad}</p>
                            )}
                            {conduce.fechaCarga && (
                              <p className="text-[11px] text-gray-500">📅 Cargado: {conduce.fechaCarga}</p>
                            )}
                            <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
                              Faltan {missingBultos} {missingBultos === 1 ? 'bulto' : 'bultos'}
                            </p>
                            {!conduceScanned && (
                              <p className="text-[11px] text-blue-600">• Conduce pendiente</p>
                            )}
                          </div>
                        );
                      })}
                    
                    {pendingConduces.filter(item => item.missingBultos > 0).length === 0 && (
                      <div className="text-center py-3 text-green-600 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs">Todos los bultos escaneados</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-2 mt-3">
            {completedConduces.map((item) => {
              const { conduce, scannedBultos, totalBultos } = item;
              return (
                <div key={conduce.id} className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-2.5">
                  <div className="flex justify-between items-start gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-green-800">
                      {conduce.numeroConduce}
                    </span>
                    <div className="flex gap-1">
                      <Badge variant="default" className="bg-green-600 text-[10px] h-4 px-1.5">
                        ✓ Conduce
                      </Badge>
                      <Badge variant="default" className="bg-green-600 text-[10px] h-4 px-1.5">
                        {scannedBultos}/{totalBultos} bultos
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 truncate">{conduce.razonSocial}</p>
                  {conduce.ciudad && (
                    <p className="text-[11px] text-gray-500">📍 {conduce.ciudad}</p>
                  )}
                </div>
              );
            })}

            {completedConduces.length === 0 && (
              <div className="text-center py-6">
                <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Ningún conduce completamente escaneado aún
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EncomendadoDetailsDialog;
