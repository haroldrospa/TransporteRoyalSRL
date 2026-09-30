import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Truck, Warehouse, ChevronDown, Check, Loader2, XCircle, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CAMIONES_DEFECTO, asignarConducesConDivisionRuta } from '@/services/rutasProgramacionService';
import { getTruckWarehouse, getRegionByTruck, isTruckWarehouse } from '@/utils/trucksByRegion';
import { asignarEncomendado } from '@/services/conduceService';

interface EncomendadoCellSelectorProps {
  conduceIds: string[];
  currentEncomendado?: string | null;
  predeterminado?: string | null;
  onAssigned?: (newEncomendado: string) => void;
  disabled?: boolean;
}

const EncomendadoCellSelector: React.FC<EncomendadoCellSelectorProps> = ({
  conduceIds,
  currentEncomendado,
  predeterminado,
  onAssigned,
  disabled = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const cleanCurrent = (currentEncomendado || '').trim();
  const isAssigned = cleanCurrent !== '';
  const isWh = isTruckWarehouse(cleanCurrent) || cleanCurrent.toLowerCase() === 'almacen';

  const handleSelect = async (newEnc: string) => {
    if (newEnc === cleanCurrent) return;
    setIsUpdating(true);
    setIsOpen(false);

    try {
      if (!newEnc) {
        await asignarEncomendado(conduceIds, '', false);
        toast({
          title: "Asignación eliminada",
          description: `Se removió la asignación de ${conduceIds.length} conduc(es)`,
        });
      } else {
        const res = await asignarConducesConDivisionRuta(conduceIds, newEnc, { prioridad: false });
        if (res.success) {
          toast({
            title: "Encomendado asignado",
            description: res.mensaje,
          });
        }
      }

      if (onAssigned) {
        onAssigned(newEnc);
      }
    } catch (err) {
      console.error('Error assigning encomendado from cell:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el encomendado",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="inline-block" 
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
          <button
            type="button"
            className="group outline-none focus:ring-2 focus:ring-royal-blue/30 rounded-full"
            aria-label="Seleccionar encomendado"
          >
            {isUpdating ? (
              <Badge variant="outline" className="text-xs py-0.5 px-2 flex items-center gap-1 bg-muted">
                <Loader2 className="h-3 w-3 animate-spin text-royal-blue" />
                <span className="text-[10px]">Guardando...</span>
              </Badge>
            ) : !isAssigned ? (
              <Badge 
                variant="outline" 
                className="text-orange-600 border-orange-400 hover:bg-orange-50 hover:border-orange-500 cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-2xs text-xs font-semibold py-0.5 px-2"
              >
                <span>Sin asignar</span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ) : isWh ? (
              <Badge 
                variant="outline" 
                className="text-amber-700 border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-2xs text-xs font-bold py-0.5 px-2"
              >
                <Warehouse className="h-3 w-3 text-amber-600 shrink-0" />
                <span>{cleanCurrent}</span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ) : (
              <Badge 
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-2xs text-xs font-bold py-0.5 px-2"
              >
                <Truck className="h-3 w-3 shrink-0" />
                <span>{cleanCurrent}</span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 text-xs max-h-80 overflow-y-auto">
          {/* Asignar predeterminado si existe */}
          {predeterminado && predeterminado.trim() !== cleanCurrent && (
            <>
              <DropdownMenuItem 
                onClick={() => handleSelect(predeterminado.trim())}
                className="cursor-pointer font-semibold text-royal-blue flex items-center gap-2 py-1.5 bg-blue-50/50 dark:bg-blue-950/30"
              >
                <Zap className="h-3.5 w-3.5 text-royal-blue shrink-0" />
                <span>Asignar predeterminado ({predeterminado})</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Submenu o lista de Camiones */}
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold py-1">
            🚚 Camiones
          </DropdownMenuLabel>
          {CAMIONES_DEFECTO.map(t => {
            const isSelected = cleanCurrent === t.camion;
            return (
              <DropdownMenuItem
                key={t.camion}
                onClick={() => handleSelect(t.camion)}
                className={`cursor-pointer flex items-center justify-between py-1.5 ${
                  isSelected ? 'bg-royal-blue/10 text-royal-blue font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-bold">{t.camion}</span>
                  <span className="text-muted-foreground truncate">{t.chofer}</span>
                  <span className="text-[9px] px-1 py-0 rounded bg-muted text-muted-foreground shrink-0">{t.region}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-royal-blue shrink-0 ml-1" />}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          {/* Lista de Almacenes */}
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold py-1">
            📦 Almacenes por Encomendado
          </DropdownMenuLabel>
          {CAMIONES_DEFECTO.map(t => {
            const wh = getTruckWarehouse(t.camion);
            const isSelected = cleanCurrent === wh;
            return (
              <DropdownMenuItem
                key={wh}
                onClick={() => handleSelect(wh)}
                className={`cursor-pointer flex items-center justify-between py-1.5 ${
                  isSelected ? 'bg-amber-500/10 text-amber-700 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Warehouse className="h-3 w-3 text-amber-600 shrink-0" />
                  <span className="font-semibold">{wh}</span>
                  <span className="text-muted-foreground text-[10px]">({t.camion})</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 ml-1" />}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuItem
            onClick={() => handleSelect('Almacen')}
            className={`cursor-pointer flex items-center justify-between py-1.5 ${
              cleanCurrent === 'Almacen' ? 'bg-amber-500/10 text-amber-700 font-bold' : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Warehouse className="h-3 w-3 text-amber-600 shrink-0" />
              <span className="font-semibold">Almacen (General)</span>
            </div>
            {cleanCurrent === 'Almacen' && <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 ml-1" />}
          </DropdownMenuItem>

          {/* Opción para quitar asignación */}
          {isAssigned && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSelect('')}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 py-1.5 font-medium"
              >
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Quitar asignación</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EncomendadoCellSelector;
