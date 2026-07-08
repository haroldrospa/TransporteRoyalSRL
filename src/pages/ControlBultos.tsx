
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Truck, RefreshCw, Upload, AlertCircle, Eye, Check, X, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { Region } from '@/types/conduces';
import RegionToggle from '@/components/lam/RegionToggle';
import { getTrucksByRegion } from '@/utils/trucksByRegion';
import AsignacionForm from '@/components/ControlBultos/AsignacionForm';
import ConducesAsignados from '@/components/ControlBultos/ConducesAsignados';
import ConducesEnTransito from '@/components/ControlBultos/ConducesEnTransito';
import DiasFestivos from '@/components/ControlBultos/DiasFestivos';
import ConducesAtrasadosEditor from '@/components/ControlBultos/ConducesAtrasadosEditor';
import { useFastControlBultos } from '@/hooks/useFastControlBultos';
import ImportExcelDialog from '@/components/lam/ImportExcelDialog';
import { getDiasFestivos } from '@/services/diasFestivos';
import { updateDiasFestivosCache } from '@/utils/time/transitTime';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchPendingConduces, approvePendingBatch, rejectPendingBatch } from '@/services/conduces/progressiveFetchConduces';


const ControlBultos = () => {
  // Use general context for clientes and assignment operations
  const { clientes, asignarEncomendado } = useData();
  const { user } = useAuth();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Use fast hook for conduces (cache-first, only "En tránsito")
  const [regionActual, setRegionActual] = useState<Region>('Norte');
  const [holidaysCacheVersion, setHolidaysCacheVersion] = useState(0);
  const { 
    conduces, 
    loading, 
    refreshing,
    refreshData, 
    getConducesByEncomendado,
    updateConduce 
  } = useFastControlBultos(regionActual);
  
  const [selectedConduces, setSelectedConduces] = useState<string[]>([]);
  
  // Pending approvals states
  const [pendingConduces, setPendingConduces] = useState<Conduce[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  
  const [activeApprovalBatch, setActiveApprovalBatch] = useState<{
    laboratorio: string;
    fechaCarga: string;
    totalConduces: number;
    totalBultos: number;
  } | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isApproving, setIsApproving] = useState(false);
  
  const [activeDetailBatch, setActiveDetailBatch] = useState<{
    laboratorio: string;
    fechaCarga: string;
    conduces: Conduce[];
  } | null>(null);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const data = await fetchPendingConduces();
      setPendingConduces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);
  
  // Load holidays cache EARLY so transit time calculations are correct
  useEffect(() => {
    getDiasFestivos().then(dias => {
      updateDiasFestivosCache(dias);
      setHolidaysCacheVersion(v => v + 1);
    });
  }, []);

  const onHolidaysChanged = useCallback(() => {
    setHolidaysCacheVersion(v => v + 1);
  }, []);
  
  console.log('🏠 [ControlBultos] Rendered - Region:', regionActual, 'Conduces:', conduces.length);
  
  // Get trucks list based on current region
  const encomendadosList = getTrucksByRegion(regionActual);
  
  // Toggle selection of a conduce
  const toggleSelection = (conduceId: string) => {
    setSelectedConduces(prev => 
      prev.includes(conduceId) 
        ? prev.filter(id => id !== conduceId) 
        : [...prev, conduceId]
    );
  };
  
  // Handle refreshing the data
  const handleRefreshData = async () => {
    await refreshData(true); // Will show toast automatically
    await loadPending();
  };
  
  const pendingGroups = useMemo(() => {
    const groups: Record<string, {
      laboratorio: string;
      fechaCarga: string;
      conduces: Conduce[];
      totalBultos: number;
    }> = {};

    pendingConduces.forEach(conduce => {
      const key = `${conduce.laboratorio}_${conduce.fechaCarga}`;
      if (!groups[key]) {
        groups[key] = {
          laboratorio: conduce.laboratorio,
          fechaCarga: conduce.fechaCarga,
          conduces: [],
          totalBultos: 0
        };
      }
      groups[key].conduces.push(conduce);
      groups[key].totalBultos += conduce.cantidadBultos;
    });

    return Object.values(groups);
  }, [pendingConduces]);

  const handleApproveBatch = async () => {
    if (!activeApprovalBatch) return;
    
    setIsApproving(true);
    try {
      const result = await approvePendingBatch(
        activeApprovalBatch.laboratorio,
        activeApprovalBatch.fechaCarga,
        deliveryDate
      );
      
      if (result.success) {
        toast({
          title: "Lote aprobado",
          description: result.message,
        });
        setActiveApprovalBatch(null);
        await loadPending();
        await refreshData(false);
      } else {
        toast({
          title: "Error al aprobar",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "No se pudo completar la aprobación",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectBatch = async (laboratorio: string, fechaCarga: string) => {
    const confirm = window.confirm(`¿Está seguro de que desea rechazar y eliminar permanentemente este lote de conduces de ${laboratorio} cargado el ${new Date(fechaCarga).toLocaleDateString()}?`);
    if (!confirm) return;
    
    try {
      const result = await rejectPendingBatch(laboratorio, fechaCarga);
      if (result.success) {
        toast({
          title: "Lote rechazado",
          description: result.message,
        });
        await loadPending();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  // Reset selections after assignment completes
  const handleAssignComplete = () => {
    setSelectedConduces([]);
    refreshData(false); // Silently refresh data to reflect changes
  };
  
  // Enrich conduces with route information from clientes
  // Recalculate whenever clientes or conduces change
  const conducesWithRouteInfo = useMemo(() => {
    // Skip enrichment if clientes haven't loaded yet
    if (clientes.length === 0) {
      return conduces;
    }
    
    return conduces.map(conduce => {
      const cliente = clientes.find(c => c.numeroCliente === conduce.numeroCliente);
      
      if (cliente) {
        return {
          ...conduce,
          ruta: cliente.ruta || conduce.ruta,
          ciudad: conduce.ciudad || cliente.ciudad,
          razonSocial: conduce.razonSocial || cliente.razonSocial
        };
      }
      
      return conduce;
    });
  }, [clientes, conduces]);
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Control de Bultos</h1>
            <RegionToggle 
              regionActual={regionActual}
              onRegionChange={setRegionActual}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              onClick={handleRefreshData}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </Button>
            
            {user?.nivel && user.nivel >= 4 && (
              <ImportExcelDialog
                isOpen={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onImportSuccess={async () => {
                  await refreshData(true);
                }}
              />
            )}
            
            <Link to="/cargar-camiones">
              <Button size="sm" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Cargar Camiones</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Pending approvals section */}
        {pendingGroups.length > 0 && (
          <Card className="border-amber-200 bg-amber-500/5 shadow-md">
            <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 animate-pulse" />
                  Cargas de Laboratorios Pendientes de Aprobación ({pendingGroups.length})
                </CardTitle>
                <CardDescription className="text-xs text-amber-600/90 dark:text-amber-500/80">
                  Lotes de conduces creados por los laboratorios que esperan confirmación de fecha de entrega para ingresar al sistema.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-amber-100 dark:border-amber-900/20 hover:bg-transparent">
                      <TableHead className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">Laboratorio</TableHead>
                      <TableHead className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">Fecha Carga</TableHead>
                      <TableHead className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider text-right">Conduces</TableHead>
                      <TableHead className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider text-right">Bultos Totales</TableHead>
                      <TableHead className="w-[300px] hover:bg-transparent"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingGroups.map((group) => {
                      const formattedDate = new Date(group.fechaCarga).toLocaleDateString('es-DO', { timeZone: 'UTC' });
                      return (
                        <TableRow key={`${group.laboratorio}_${group.fechaCarga}`} className="hover:bg-amber-500/10 border-b border-amber-100 dark:border-amber-900/10">
                          <TableCell className="font-bold text-foreground">{group.laboratorio}</TableCell>
                          <TableCell className="font-semibold text-muted-foreground">{formattedDate}</TableCell>
                          <TableCell className="font-bold text-right">{group.conduces.length}</TableCell>
                          <TableCell className="font-bold text-right text-green-600 dark:text-green-400">{group.totalBultos}</TableCell>
                          <TableCell className="flex justify-end gap-2 p-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setActiveDetailBatch({
                                laboratorio: group.laboratorio,
                                fechaCarga: group.fechaCarga,
                                conduces: group.conduces
                              })}
                              className="flex items-center gap-1 h-8 text-xs border-amber-200/50 hover:bg-amber-500/10"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detalles
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setActiveApprovalBatch({
                                  laboratorio: group.laboratorio,
                                  fechaCarga: group.fechaCarga,
                                  totalConduces: group.conduces.length,
                                  totalBultos: group.totalBultos
                                });
                                setDeliveryDate(new Date().toISOString().split('T')[0]);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 text-xs flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Aceptar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRejectBatch(group.laboratorio, group.fechaCarga)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8 text-xs flex items-center gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              Rechazar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AsignacionForm 
            encomendadosList={encomendadosList}
            selectedConduces={selectedConduces}
            conduces={conducesWithRouteInfo}
            asignarEncomendado={asignarEncomendado}
            onAssignComplete={handleAssignComplete}
          />
          
          <ConducesAsignados 
            encomendadosList={encomendadosList}
            loading={loading || refreshing}
            getConducesByEncomendado={getConducesByEncomendado}
            clientes={clientes}
            refreshData={() => refreshData(false)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DiasFestivos onHolidaysChanged={onHolidaysChanged} />
          <ConducesAtrasadosEditor />
        </div>
        
        <ConducesEnTransito 
          conduces={conducesWithRouteInfo}
          loading={loading}
          selectedConduces={selectedConduces}
          toggleSelection={toggleSelection}
          setSelectedConduces={setSelectedConduces}
          clientes={clientes}
          holidaysCacheVersion={holidaysCacheVersion}
        />
        
      </div>
      {/* Dialog for batch approval */}
      <Dialog 
        open={!!activeApprovalBatch} 
        onOpenChange={(open) => {
          if (!open) setActiveApprovalBatch(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-royal-blue dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Aprobar Carga de {activeApprovalBatch?.laboratorio}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirma y aprueba el ingreso de este lote de conduces.
            </DialogDescription>
          </DialogHeader>
          
          {activeApprovalBatch && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg text-xs space-y-1.5 border">
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Laboratorio:</span>
                  <span className="font-bold">{activeApprovalBatch.laboratorio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Fecha de Carga:</span>
                  <span className="font-bold">{new Date(activeApprovalBatch.fechaCarga).toLocaleDateString('es-DO', { timeZone: 'UTC' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Conduces:</span>
                  <span className="font-bold">{activeApprovalBatch.totalConduces}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Bultos Totales:</span>
                  <span className="font-bold text-green-600">{activeApprovalBatch.totalBultos}</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="delivery-date-confirm" className="text-xs font-semibold">Seleccionar Fecha de Entrega</Label>
                <Input 
                  id="delivery-date-confirm" 
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Esta fecha de salida/entrega se aplicará a todos los conduces de este lote.</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActiveApprovalBatch(null)} 
              disabled={isApproving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleApproveBatch} 
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold min-w-[120px]"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Aprobando...
                </>
              ) : (
                'Aprobar Lote'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for batch details */}
      <Dialog 
        open={!!activeDetailBatch} 
        onOpenChange={(open) => {
          if (!open) setActiveDetailBatch(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-6">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-lg font-bold text-royal-blue dark:text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-500" />
              Detalle de Lote - {activeDetailBatch?.laboratorio} ({activeDetailBatch?.fechaCarga ? new Date(activeDetailBatch.fechaCarga).toLocaleDateString('es-DO', { timeZone: 'UTC' }) : ''})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Listado de conduces pendientes de aprobación.
            </DialogDescription>
          </DialogHeader>
          
          {activeDetailBatch && (
            <div className="flex-1 overflow-y-auto py-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="font-bold">No. Conduce</TableHead>
                      <TableHead className="font-bold">No. Factura</TableHead>
                      <TableHead className="font-bold">Destinatario</TableHead>
                      <TableHead className="font-bold">Ciudad</TableHead>
                      <TableHead className="font-bold text-right">Bultos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDetailBatch.conduces.map((conduce) => (
                      <TableRow key={conduce.id}>
                        <TableCell className="font-bold">{conduce.numeroConduce}</TableCell>
                        <TableCell className="font-semibold text-muted-foreground">{conduce.numeroFactura}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-xs">{conduce.razonSocial}</p>
                            <span className="text-[9px] text-muted-foreground">Cód: {conduce.numeroCliente}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-royal-blue dark:text-royal-yellow">{conduce.ciudad}</TableCell>
                        <TableCell className="font-bold text-right">{conduce.cantidadBultos}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-2 border-t mt-auto">
            <Button variant="outline" onClick={() => setActiveDetailBatch(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ControlBultos;
