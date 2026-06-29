import { RefreshCw, ClipboardCheck, Volume2, VolumeX, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import RegionToggle from '@/components/lam/RegionToggle';
import { Region } from '@/types/conduces';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ControlConducesHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  regionActual: Region;
  onRegionChange: (region: Region) => void;
  voiceEnabled: boolean;
  voiceSpeed: number;
  onToggleVoice: () => void;
  onVoiceSpeedChange: (speed: number) => void;
}

const ControlConducesHeader = ({ 
  isRefreshing, 
  onRefresh, 
  regionActual, 
  onRegionChange,
  voiceEnabled,
  voiceSpeed,
  onToggleVoice,
  onVoiceSpeedChange
}: ControlConducesHeaderProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllScans = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .in('scan_type', ['conduce_nave', 'conduce_no_recibido']);

      if (error) throw error;

      toast.success('Todos los escaneos de nave han sido eliminados');
      onRefresh();
    } catch (error) {
      console.error('Error eliminando escaneos:', error);
      toast.error('Error al eliminar los escaneos');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Control de Conduces</h1>
            <p className="text-sm text-muted-foreground">
              Recepción de conduces en nave
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Eliminar todos los escaneos</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar todos los escaneos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todos los escaneos de recepción en nave de todas las relaciones. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllScans}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar todo'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                title="Configuración de voz"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Anuncio de voz</span>
                  <Button
                    variant={voiceEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={onToggleVoice}
                  >
                    {voiceEnabled ? "Activada" : "Desactivada"}
                  </Button>
                </div>
                {voiceEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Velocidad</span>
                      <span className="text-sm font-medium">{voiceSpeed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[voiceSpeed]}
                      onValueChange={([value]) => onVoiceSpeedChange(value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Lento</span>
                      <span>Rápido</span>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="icon"
            onClick={onToggleVoice}
            className="h-10 w-10"
            title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <RegionToggle regionActual={regionActual} onRegionChange={onRegionChange} />
    </div>
  );
};

export default ControlConducesHeader;
