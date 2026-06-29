import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Navigation, Compass, Map, ExternalLink, Smartphone, MapPin } from 'lucide-react';

interface MapChooserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ubicacion?: string;
  clienteNombre?: string;
}

export const MapChooserDialog: React.FC<MapChooserDialogProps> = ({
  open,
  onOpenChange,
  ubicacion,
  clienteNombre = 'Cliente'
}) => {
  // Detectar plataforma
  const device = useMemo(() => {
    if (typeof window === 'undefined') return { isIOS: false, isAndroid: false, isMobile: false };
    
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOSPlatform = /iPad|iPhone|iPod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidPlatform = /Android/i.test(userAgent);
    
    return {
      isIOS: isIOSPlatform,
      isAndroid: isAndroidPlatform,
      isMobile: isIOSPlatform || isAndroidPlatform
    };
  }, []);

  // Parsear ubicación a coordenadas si es posible
  const parsedCoords = useMemo(() => {
    if (!ubicacion) return null;
    const parts = ubicacion.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  }, [ubicacion]);

  // Generar URLs para cada mapa
  const mapUrls = useMemo(() => {
    if (!ubicacion) return null;
    
    if (parsedCoords) {
      const { lat, lng } = parsedCoords;
      return {
        googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
        appleMaps: `maps://?q=${lat},${lng}`,
        geoUri: `geo:${lat},${lng}?q=${lat},${lng}`
      };
    } else {
      // Si no son coordenadas, buscar como texto
      const query = encodeURIComponent(ubicacion);
      return {
        googleMaps: `https://www.google.com/maps/search/?api=1&query=${query}`,
        waze: `https://waze.com/ul?q=${query}&navigate=yes`,
        appleMaps: `maps://?q=${query}`,
        geoUri: `geo:0,0?q=${query}`
      };
    }
  }, [ubicacion, parsedCoords]);

  const handleOpenMap = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  if (!ubicacion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-card p-0 overflow-hidden border border-border/40 shadow-2xl">
        <DialogHeader className="p-5 pb-4 relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-royal-blue/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white shrink-0">
              <Compass className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground leading-tight">
                Navegar hacia
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5 truncate max-w-[240px]">
                {clienteNombre}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-3.5 bg-royal-light/10 dark:bg-muted/5">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 px-1">
            <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            Ubicación: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] truncate max-w-[220px]">{ubicacion}</code>
          </p>

          <div className="space-y-2.5">
            {/* GOOGLE MAPS */}
            {mapUrls?.googleMaps && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start px-4 gap-3 bg-card hover:bg-slate-50 hover:border-emerald-200 dark:hover:bg-muted/20 border border-border/60 transition-all rounded-xl shadow-sm text-left group"
                onClick={() => handleOpenMap(mapUrls.googleMaps)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Navigation className="h-4.5 w-4.5 rotate-45" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    Google Maps
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal truncate">
                    Navegar con Google Maps (App / Web)
                  </div>
                </div>
              </Button>
            )}

            {/* WAZE */}
            {mapUrls?.waze && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start px-4 gap-3 bg-card hover:bg-slate-50 hover:border-sky-200 dark:hover:bg-muted/20 border border-border/60 transition-all rounded-xl shadow-sm text-left group"
                onClick={() => handleOpenMap(mapUrls.waze)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-500 dark:bg-sky-950/30 dark:text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                  <Compass className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    Waze
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal truncate">
                    Navegación con alertas de tráfico en tiempo real
                  </div>
                </div>
              </Button>
            )}

            {/* APPLE MAPS - Solo iOS / Mac */}
            {device.isIOS && mapUrls?.appleMaps && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start px-4 gap-3 bg-card hover:bg-slate-50 hover:border-indigo-200 dark:hover:bg-muted/20 border border-border/60 transition-all rounded-xl shadow-sm text-left group"
                onClick={() => handleOpenMap(mapUrls.appleMaps)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                  <Map className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    Apple Maps
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal truncate">
                    Navegación nativa en dispositivos iOS
                  </div>
                </div>
              </Button>
            )}

            {/* SELECTOR NATIVO / GEO URI - Solo móviles (principalmente Android) */}
            {device.isMobile && !device.isIOS && mapUrls?.geoUri && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start px-4 gap-3 bg-card hover:bg-slate-50 hover:border-amber-200 dark:hover:bg-muted/20 border border-border/60 transition-all rounded-xl shadow-sm text-left group"
                onClick={() => handleOpenMap(mapUrls.geoUri)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-950/30 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    Selector del Sistema
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal truncate">
                    Abrir el selector nativo de mapas de tu móvil
                  </div>
                </div>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default MapChooserDialog;
