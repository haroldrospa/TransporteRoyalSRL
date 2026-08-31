import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { X, Camera, CheckCircle, AlertTriangle, XCircle, Package, FileText, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { ScanResult } from '@/hooks/use-scanner';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: 'conduce' | 'bulto';
  onScan: (value: string) => void;
  scanResult?: ScanResult | null;
  initialError?: string | null;
}

const SCANNER_CONTAINER_ID = 'camera-scanner-container';

const CameraScannerDialog = ({
  open,
  onOpenChange,
  scanType,
  onScan,
  scanResult,
  initialError,
}: CameraScannerDialogProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  
  const scanCooldownRef = useRef<boolean>(false);
  const onScanRef = useRef(onScan);
  const soundEnabledRef = useRef(soundEnabled);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Play beep sound
  const playBeep = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch {
      console.log('Audio not supported');
    }
  }, []);

  // Vibrate on scan
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }, []);

  // Get user-friendly error message
  const getCameraErrorMessage = useCallback((err: any): string => {
    const name = err?.name || '';
    const message = typeof err === 'string' ? err : err?.message || '';
    const combined = `${name} ${message}`.toLowerCase();
    
    if (name === 'NotAllowedError' || combined.includes('denied') || combined.includes('permission')) {
      return 'Permiso de cámara denegado. Activa el permiso en la configuración del navegador.';
    }
    if (name === 'NotFoundError' || combined.includes('not found')) {
      return 'No se encontró una cámara en este dispositivo.';
    }
    if (name === 'NotReadableError' || combined.includes('in use') || combined.includes('busy')) {
      return 'La cámara está siendo usada por otra aplicación. Cierra otras apps y vuelve a intentar.';
    }
    if (name === 'SecurityError' || combined.includes('secure')) {
      return 'El navegador bloqueó la cámara. Usa HTTPS.';
    }
    
    return 'No se pudo acceder a la cámara. Verifica los permisos.';
  }, []);

  // Stop scanner and cleanup
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Handle detected code
  const handleCodeDetected = useCallback((code: string) => {
    if (scanCooldownRef.current) return;
    
    scanCooldownRef.current = true;
    setLastScannedCode(code);
    
    playBeep();
    vibrate();
    
    console.log('✅ Código detectado:', code);
    onScanRef.current(code);
    
    // Cooldown to prevent duplicate scans
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1500);
  }, [playBeep, vibrate]);

  // Start scanner
  const startScanner = useCallback(async () => {
    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      setError(null);
      
      // Stop any existing scanner first
      await stopScanner();
      
      // Wait for DOM element
      await new Promise(r => setTimeout(r, 100));
      
      const container = document.getElementById(SCANNER_CONTAINER_ID);
      if (!container) {
        throw new Error('Scanner container not found');
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create scanner
      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      
      scannerRef.current = scanner;
      
      // Get camera
      let cameraId: string | undefined;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // Prefer back camera if available, otherwise take the first available camera
          const backCamera = cameras.find(c => /back|rear|trasera|environment/i.test(c.label));
          cameraId = backCamera?.id || cameras[0].id;
        }
      } catch (camErr) {
        console.warn('getCameras note:', camErr);
      }
      
      const config = {
        fps: 25,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.min(Math.round(viewfinderWidth * 0.86), 330);
          const height = Math.min(Math.round(viewfinderHeight * 0.32), 90);
          return { width, height };
        },
        aspectRatio: 1.45,
      };
      
      const successCallback = (decodedText: string) => {
        handleCodeDetected(decodedText);
      };
      
      // Try starting with deviceId or facingMode, with automatic fallback
      try {
        if (cameraId) {
          await scanner.start(
            cameraId,
            config,
            successCallback,
            () => {}
          );
        } else {
          await scanner.start(
            { facingMode: 'environment' },
            config,
            successCallback,
            () => {}
          );
        }
      } catch (firstAttemptErr) {
        console.warn('First start attempt failed, trying general facingMode/user camera:', firstAttemptErr);
        try {
          await scanner.start(
            { facingMode: 'user' },
            config,
            successCallback,
            () => {}
          );
        } catch (secondAttemptErr) {
          try {
            const cameras = await Html5Qrcode.getCameras().catch(() => []);
            if (cameras.length > 0) {
              await scanner.start(cameras[0].id, config, successCallback, () => {});
            } else {
              throw secondAttemptErr;
            }
          } catch (thirdAttemptErr) {
            throw firstAttemptErr || secondAttemptErr || thirdAttemptErr;
          }
        }
      }
      
      if (isMountedRef.current) {
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      if (isMountedRef.current) {
        setError(getCameraErrorMessage(err));
        setIsScanning(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanner, handleCodeDetected, getCameraErrorMessage]);

  // Start scanner when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
      setError(null);
      setLastScannedCode(null);
    }
  }, [open, startScanner, stopScanner]);

  // Handle initial error
  useEffect(() => {
    if (initialError && open) {
      setError(initialError);
    }
  }, [initialError, open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Get status icon
  const getStatusIcon = () => {
    if (!scanResult) return null;
    
    switch (scanResult.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
      case 'duplicate':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-500 shrink-0" />;
      default:
        return null;
    }
  };

  // Get status color class
  const getStatusColorClass = () => {
    if (!scanResult) return 'bg-muted/40 border-border/60';
    
    switch (scanResult.type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200';
      case 'duplicate':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200';
      case 'error':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200';
      default:
        return 'bg-muted/40 border-border/60';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background border-border/80 shadow-2xl rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Escáner de {scanType === 'conduce' ? 'Conduce' : 'Bulto'}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-royal-blue/10 text-royal-blue">
              {scanType === 'conduce' ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground">
                Escanear {scanType === 'conduce' ? 'Conduce' : 'Bulto'}
              </span>
              <p className="text-[11px] text-muted-foreground">Lector de código de barras activo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black h-[280px] sm:h-[300px] overflow-hidden flex items-center justify-center">
          {/* Scanner container - html5-qrcode video */}
          <div 
            id={SCANNER_CONTAINER_ID}
            className="w-full h-full"
          />
          
          {/* Clean Rectangular Barcode Overlay with Cutout Mask */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
              {/* Target Window */}
              <div className="w-[84%] max-w-[320px] h-[90px] rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] border border-white/30">
                {/* Glowing Laser Scan Line */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]"
                  style={{
                    top: '50%',
                    animation: 'scan-laser 2s ease-in-out infinite'
                  }}
                />
                
                {/* 4 Crisp White Corner Brackets */}
                <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-lg" />
                <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-lg" />
                <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-lg" />
                <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-3 border-r-3 border-white rounded-br-lg" />
              </div>
              
              <p className="text-white/90 text-center text-xs font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                Apunta el código de barras dentro del marco
              </p>
            </div>
          )}

          {/* Loading state */}
          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
              <Loader2 className="h-8 w-8 text-royal-blue animate-spin mb-3" />
              <p className="text-white text-xs font-medium">Iniciando cámara...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
              <Camera className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <p className="text-white text-xs font-medium mb-4 max-w-xs leading-relaxed">{error}</p>
              <Button
                onClick={startScanner}
                variant="secondary"
                size="sm"
                className="h-8 text-xs font-semibold px-4"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>

        {/* Scan Results Section */}
        <div className="bg-card p-3.5 border-t border-border/60">
          {scanResult ? (
            <div className={`p-3 rounded-xl border ${getStatusColorClass()} transition-all animate-fade-in`}>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {getStatusIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs leading-snug">
                      {scanResult.message}
                    </p>
                    {scanResult.encomendado && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-royal-blue text-white shrink-0">
                        {scanResult.encomendado}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                    {scanResult.value && (
                      <div className="bg-background/80 px-2 py-1 rounded border border-border/40">
                        <span className="text-muted-foreground block text-[9px] uppercase font-medium">Código</span>
                        <span className="font-bold font-mono text-foreground">{scanResult.value}</span>
                      </div>
                    )}
                    {scanResult.bultos !== undefined && (
                      <div className="bg-background/80 px-2 py-1 rounded border border-border/40">
                        <span className="text-muted-foreground block text-[9px] uppercase font-medium">Bultos</span>
                        <span className="font-bold text-foreground">{scanResult.bultos}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : lastScannedCode ? (
            <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-royal-blue shrink-0" />
              <p className="text-xs text-foreground font-medium">
                Procesando código: <span className="font-mono font-bold">{lastScannedCode}</span>
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-border/80 text-center bg-muted/10">
              <p className="text-xs text-muted-foreground">
                Los resultados del escaneo aparecerán aquí en vivo
              </p>
            </div>
          )}
        </div>

        {/* Global Styles for Scanner Container */}
        <style>{`
          @keyframes scan-laser {
            0%, 100% { transform: translateY(-28px); opacity: 0.6; }
            50% { transform: translateY(28px); opacity: 1; }
          }
          #${SCANNER_CONTAINER_ID} {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          #${SCANNER_CONTAINER_ID} #qr-shaded-region {
            display: none !important;
          }
          #${SCANNER_CONTAINER_ID} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 0 !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScannerDialog;
