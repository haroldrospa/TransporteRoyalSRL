import { Button } from '@/components/ui/button';
import { RefreshCw, Volume2, VolumeX, Settings2, Play } from 'lucide-react';
import { useState } from 'react';
import { organizarConducesEnRelaciones } from '@/services/relaciones/organizarConducesService';
import RegionToggle from '@/components/lam/RegionToggle';
import { Region } from '@/types/conduces';
import { useScanVoiceSetting } from '@/hooks/useScanVoiceSetting';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface CargarCamionesHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  regionActual: Region;
  onRegionChange: (region: Region) => void;
}
const CargarCamionesHeader = ({
  isRefreshing,
  onRefresh,
  regionActual,
  onRegionChange
}: CargarCamionesHeaderProps) => {
  const [isOrganizing, setIsOrganizing] = useState(false);
  const { enabled: voiceEnabled, toggle: toggleVoice, rate, setRate, pitch, setPitch } = useScanVoiceSetting();

  const handleOrganizarConduces = async () => {
    setIsOrganizing(true);
    try {
      await organizarConducesEnRelaciones();
      onRefresh();
    } catch (error) {
      console.error('Error organizing conduces:', error);
    } finally {
      setIsOrganizing(false);
    }
  };

  const testVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance('Prueba de voz, encomendado uno');
    u.lang = 'es-ES';
    u.rate = rate;
    u.pitch = pitch;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cargar Camiones</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={toggleVoice}
            className="flex items-center gap-2"
            title={voiceEnabled ? 'Desactivar locución al escanear' : 'Activar locución al escanear'}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">Voz: {voiceEnabled ? 'ON' : 'OFF'}</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Ajustes de voz" disabled={!voiceEnabled}>
                <Settings2 size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-4" align="end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Velocidad</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{rate.toFixed(2)}x</span>
                </div>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={[rate]}
                  onValueChange={(v) => setRate(v[0])}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tono</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{pitch.toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={[pitch]}
                  onValueChange={(v) => setPitch(v[0])}
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => { setRate(1); setPitch(1); }}>
                  Restablecer
                </Button>
                <Button size="sm" onClick={testVoice} className="flex items-center gap-1">
                  <Play size={14} /> Probar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing} className="flex items-center gap-2">
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Actualizar datos
          </Button>
        </div>
      </div>
      <RegionToggle regionActual={regionActual} onRegionChange={onRegionChange} />
    </div>
  );
};
export default CargarCamionesHeader;
