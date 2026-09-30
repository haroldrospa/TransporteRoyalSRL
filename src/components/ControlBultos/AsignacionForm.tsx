import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, Truck, Trash2, MapPin, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Conduce, Region } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { cambiarRegionConduces } from '@/services/conduceService';
import { getRegionByTruck, getAllValidTrucks, getTruckWarehouse, getBaseTruck } from '@/utils/trucksByRegion';
import { 
  CAMIONES_DEFECTO, 
  ProgramacionSemanal, 
  getRutaProgramadaHoy,
  asignarConducesConDivisionRuta
} from '@/services/rutasProgramacionService';

interface AsignacionFormProps {
  encomendadosList: string[];
  selectedConduces: string[];
  conduces: Conduce[];
  asignarEncomendado: (conduceIds: string[], encomendado: string, prioridad?: boolean) => Promise<void>;
  onAssignComplete: () => void;
  regionActual?: Region | string;
  programacion?: ProgramacionSemanal;
  clientes?: Cliente[];
}

const AsignacionForm = ({
  encomendadosList,
  selectedConduces,
  conduces,
  asignarEncomendado,
  onAssignComplete,
  regionActual,
  programacion = {},
  clientes = []
}: AsignacionFormProps) => {
  const [currentEncomendado, setCurrentEncomendado] = useState('AUTO_CLIENTE');
  const [newRegion, setNewRegion] = useState<Region | ''>('');
  const [isPriority, setIsPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegionChange, setShowRegionChange] = useState(false);

  const allValidTrucks = getAllValidTrucks();
  const otherTrucks = allValidTrucks.filter(t => !encomendadosList.includes(t));

  // Get stats for selected conduces
  const selectedStats = {
    bultos: selectedConduces.reduce((total, id) => {
      const c = conduces.find(item => item.id === id);
      return total + (c ? c.cantidadBultos : 0);
    }, 0),
    clientes: new Set(selectedConduces.map(id => {
      const c = conduces.find(item => item.id === id);
      return c ? c.numeroCliente : '';
    })).size
  };

  // Assign selected conduces directly to trucks
  const handleAssignEncomendado = async () => {
    if (!currentEncomendado) {
      toast({
        title: "Error",
        description: "Selecciona un chofer o la opción automática.",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedConduces.length === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos un conduce en la tabla.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (currentEncomendado === 'AUTO_CLIENTE') {
        const grupos: Record<string, string[]> = {};
        for (const id of selectedConduces) {
          const c = conduces.find(item => item.id === id);
          const cl = clientes.find(item => item.numeroCliente === c?.numeroCliente);
          const truck = cl?.encomendado || c?.encomendado;
          if (truck && !truck.toLowerCase().includes('almacen')) {
            if (!grupos[truck]) grupos[truck] = [];
            grupos[truck].push(id);
          }
        }

        for (const [truck, ids] of Object.entries(grupos)) {
          await asignarEncomendado(ids, truck, isPriority);
        }

        toast({
          title: "Conduces asignados",
          description: `${selectedConduces.length} conduces asignados a sus choferes.`,
        });
      } else {
        await asignarEncomendado(selectedConduces, currentEncomendado, isPriority);
        toast({
          title: "Conduces asignados",
          description: `${selectedConduces.length} conduces asignados a ${currentEncomendado}.`,
        });
      }
      onAssignComplete();
    } catch (error) {
      console.error('Error assigning encomendado:', error);
      toast({
        title: "Error",
        description: "No se pudieron asignar los conduces.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove assignment
  const handleRemoveAssignment = async () => {
    if (selectedConduces.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await asignarEncomendado(selectedConduces, '', false);
      toast({
        title: "Asignación removida",
        description: `Se desasignaron ${selectedConduces.length} conduces.`,
      });
      onAssignComplete();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "No se pudo remover la asignación.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change region
  const handleUpdateRegion = async () => {
    if (!newRegion || selectedConduces.length === 0) return;

    setIsSubmitting(true);
    try {
      await cambiarRegionConduces(selectedConduces, newRegion);
      toast({
        title: "Región actualizada",
        description: `${selectedConduces.length} conduces asignados a Zona ${newRegion}.`,
      });
      setNewRegion('');
      setShowRegionChange(false);
      onAssignComplete();
    } catch (error) {
      console.error('Error changing region:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la región.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDriverForTruck = (truckCode: string) => {
    const norm = getBaseTruck(truckCode);
    const found = CAMIONES_DEFECTO.find(c => c.camion === norm);
    return found?.chofer || '';
  };

  const currentRegionTrucks = encomendadosList.filter(enc => enc !== 'Almacen');
  const otherRegionTrucks = otherTrucks.filter(enc => enc !== 'Almacen');
  const hasSelection = selectedConduces.length > 0;

  return (
    <Card className="col-span-1 shadow-xs border border-border/70 rounded-xl bg-card">
      <CardHeader className="p-4 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Truck className="h-4 w-4 text-royal-blue" />
            Asignar Conduces
          </CardTitle>
          {hasSelection && (
            <span className="text-[11px] font-medium text-royal-blue bg-royal-blue/10 px-2 py-0.5 rounded-full">
              {selectedConduces.length} seleccionados
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Selector de Destino */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">
            Chofer / Destino
          </label>

          <select 
            className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-royal-blue transition-colors cursor-pointer"
            value={currentEncomendado}
            onChange={(e) => setCurrentEncomendado(e.target.value)}
          >
            <option value="AUTO_CLIENTE">
              Auto-asignar por cliente (Ruta de hoy)
            </option>
            
            {currentRegionTrucks.length > 0 && (
              <optgroup label={`Región ${regionActual || 'Actual'}`}>
                {currentRegionTrucks.map(truck => {
                  const driver = getDriverForTruck(truck);
                  const rutaHoy = programacion ? getRutaProgramadaHoy(programacion, truck) : '';
                  const rutaBadge = rutaHoy === 'Todas' ? 'Todas' : rutaHoy === 'Descanso' ? 'Descanso' : `Ruta ${rutaHoy}`;
                  return (
                    <option key={truck} value={truck}>
                      {truck} — {driver || 'Camión'} {rutaHoy ? `(${rutaBadge})` : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}

            {otherRegionTrucks.length > 0 && (
              <optgroup label="Otras Regiones">
                {otherRegionTrucks.map(truck => {
                  const driver = getDriverForTruck(truck);
                  const r = getRegionByTruck(truck);
                  return (
                    <option key={truck} value={truck}>
                      {truck} — {driver || 'Camión'} {r ? `[${r}]` : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>
        </div>
        
        {/* Prioridad & Resumen Minimalista */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
            <Checkbox 
              id="priority" 
              checked={isPriority}
              onCheckedChange={(checked) => setIsPriority(checked as boolean)}
            />
            <span className="text-xs">Prioridad</span>
          </label>

          <div className="text-[11px] text-muted-foreground font-medium">
            {hasSelection ? (
              <span>
                <strong>{selectedStats.bultos}</strong> bultos · <strong>{selectedStats.clientes}</strong> clientes
              </span>
            ) : (
              <span>0 conduces seleccionados</span>
            )}
          </div>
        </div>
        
        {/* Acciones principales */}
        <div className="space-y-1.5 pt-1">
          <Button 
            className="w-full bg-royal-blue hover:bg-blue-700 text-white font-medium text-xs h-9 rounded-lg transition-all" 
            onClick={handleAssignEncomendado}
            disabled={!currentEncomendado || !hasSelection || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              'Asignar Conduces'
            )}
          </Button>
          
          {hasSelection && (
            <Button 
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-7 font-normal" 
              onClick={handleRemoveAssignment}
              disabled={isSubmitting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remover asignación
            </Button>
          )}
        </div>

        {/* Zona / Región (Minimalista) */}
        <div className="pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => setShowRegionChange(!showRegionChange)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer bg-transparent border-0 p-0"
          >
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>Cambiar región de conduces</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showRegionChange ? 'rotate-180' : ''}`} />
          </button>

          {showRegionChange && (
            <div className="pt-2 flex items-center gap-1.5 animate-fade-in">
              <select 
                className="flex-1 h-8 px-2 text-xs rounded-md border border-input bg-background"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value as Region)}
              >
                <option value="">Seleccionar zona...</option>
                <option value="Norte">Zona Norte</option>
                <option value="Sur">Zona Sur</option>
                <option value="Este">Zona Este</option>
              </select>
              
              <Button 
                size="sm"
                className="h-8 px-2.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-md" 
                onClick={handleUpdateRegion}
                disabled={!hasSelection || !newRegion || isSubmitting}
              >
                Cambiar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AsignacionForm;
