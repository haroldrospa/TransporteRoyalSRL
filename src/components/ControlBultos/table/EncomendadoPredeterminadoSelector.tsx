import React, { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Truck, ChevronDown, Check, Loader2, XCircle, Warehouse } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CAMIONES_DEFECTO } from '@/services/rutasProgramacionService';
import { supabase } from '@/integrations/supabase/client';
import { getTruckWarehouse, isTruckWarehouse } from '@/utils/trucksByRegion';

import { useData } from '@/contexts/DataContext';

interface EncomendadoPredeterminadoSelectorProps {
  numeroClientes: string[];
  clienteNombre?: string;
  currentPredeterminado?: string | null;
  onUpdated?: (newTruck: string) => void;
  disabled?: boolean;
}

export const EncomendadoPredeterminadoSelector: React.FC<EncomendadoPredeterminadoSelectorProps> = ({
  numeroClientes,
  clienteNombre,
  currentPredeterminado,
  onUpdated,
  disabled = false
}) => {
  const { updateClienteEncomendado } = useData();
  const [selectedTruck, setSelectedTruck] = useState<string>(currentPredeterminado || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isUpdating && currentPredeterminado !== undefined) {
      setSelectedTruck(currentPredeterminado || '');
    }
  }, [currentPredeterminado, isUpdating]);

  const cleanCurrent = (selectedTruck || '').trim();
  const isAssigned = cleanCurrent !== '';
  const isWh = isTruckWarehouse(cleanCurrent) || cleanCurrent.toLowerCase() === 'almacen';

  const handleSelect = async (newTruck: string) => {
    const cleanNew = (newTruck || '').trim();
    if (cleanNew === cleanCurrent) return;

    setIsUpdating(true);
    setIsOpen(false);
    setSelectedTruck(cleanNew); // Optimistic UI update immediately

    try {
      const validNumbers = numeroClientes.filter(
        (n) => n && !n.startsWith('__sin_asignar__')
      );

      if (validNumbers.length > 0) {
        if (updateClienteEncomendado) {
          await updateClienteEncomendado(validNumbers, cleanNew || null);
        } else {
          const { error } = await supabase
            .from('clientes')
            .update({ encomendado: cleanNew || null })
            .in('numero_cliente', validNumbers);

          if (error) throw error;
        }
      }

      toast({
        title: cleanNew ? "Predeterminado actualizado" : "Predeterminado removido",
        description: cleanNew
          ? `${cleanNew} asignado como predeterminado para ${clienteNombre || 'el cliente'}`
          : `Se removió el encomendado predeterminado para ${clienteNombre || 'el cliente'}`,
      });

      if (onUpdated) {
        onUpdated(cleanNew);
      }
    } catch (err) {
      console.error('Error actualizando encomendado predeterminado:', err);
      setSelectedTruck(cleanCurrent); // Revert on failure
      toast({
        title: "Error",
        description: "No se pudo actualizar el encomendado predeterminado",
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
            aria-label="Seleccionar encomendado predeterminado"
            title="Cambiar encomendado predeterminado"
          >
            {isUpdating ? (
              <Badge variant="outline" className="text-xs py-0.5 px-2 flex items-center gap-1 bg-muted">
                <Loader2 className="h-3 w-3 animate-spin text-royal-blue" />
                <span className="text-[10px]">Guardando...</span>
              </Badge>
            ) : !isAssigned ? (
              <Badge 
                variant="outline" 
                className="text-slate-400 border-dashed border-slate-300 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 text-xs italic py-0.5 px-2"
              >
                <span>No definido</span>
                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ) : isWh ? (
              <Badge 
                variant="outline" 
                className="text-amber-700 border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 text-xs font-semibold py-0.5 px-2"
              >
                <Warehouse className="h-3 w-3 text-amber-600 shrink-0" />
                <span>{cleanCurrent}</span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="text-royal-blue border-royal-blue/40 bg-blue-50/70 hover:bg-blue-100 hover:border-royal-blue cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 text-xs font-bold py-0.5 px-2"
              >
                <Truck className="h-3 w-3 shrink-0 text-royal-blue" />
                <span>{cleanCurrent}</span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 text-xs max-h-80 overflow-y-auto">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold py-1">
            🚚 Encomendado Predeterminado
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

          {isAssigned && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSelect('')}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 py-1.5 font-medium"
              >
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Quitar predeterminado</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EncomendadoPredeterminadoSelector;
