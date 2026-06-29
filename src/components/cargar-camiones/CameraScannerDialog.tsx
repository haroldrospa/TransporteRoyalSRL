import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { X, Camera, CheckCircle, AlertTriangle, XCircle, Package, FileText, Volume2, VolumeX } from 'lucide-react';
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
        if (cameras.length > 0) {
          // Prefer back camera
          const backCamera = cameras.find(c => /back|rear|environment/i.test(c.label));
          cameraId = backCamera?.id || cameras[cameras.length - 1].id;
        }
      } catch {
        // Will use facingMode instead
      }
      
      const config = {
        fps: 15,
        qrbox: { width: 280, height: 120 },
        aspectRatio: 1.5,
      };
      
      const successCallback = (decodedText: string) => {
        handleCodeDetected(decodedText);
      };
      
      // Try starting with deviceId or facingMode
      if (cameraId) {
        await scanner.start(
          { deviceId: cameraId },
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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'duplicate':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Get status color class
  const getStatusColorClass = () => {
    if (!scanResult) return 'bg-muted';
    
    switch (scanResult.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'duplicate':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-black">
        <VisuallyHidden>
          <DialogTitle>Escáner de {scanType === 'conduce' ? 'Conduce' : 'Bulto'}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-background border-b">
          <div className="flex items-center gap-2">
            {scanType === 'conduce' ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <Package className="h-5 w-5 text-primary" />
            )}
            <span className="font-medium">
              Escanear {scanType === 'conduce' ? 'Conduce' : 'Bulto'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative bg-black" style={{ minHeight: '300px' }}>
          {/* Scanner container - html5-qrcode renders video here */}
          <div 
            id={SCANNER_CONTAINER_ID}
            className="w-full"
            style={{ minHeight: '300px' }}
          />
          
          {/* Red scanning line overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[90%] relative">
                {/* Scanning area border */}
                <div className="border-2 border-white/30 rounded-lg h-24 relative">
                  {/* Animated red line */}
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    style={{
                      top: '50%',
                      animation: 'scan-line 2s ease-in-out infinite'
                    }}
                  />
                  
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br" />
                </div>
                
                <p className="text-white text-center text-sm mt-2 opacity-80">
                  Coloca el código de barras dentro del recuadro
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <Camera className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
              <p className="text-white text-center">Iniciando cámara...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-white text-center mb-4">{error}</p>
              <Button
                onClick={startScanner}
                variant="secondary"
                size="sm"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>

        {/* Scan Results Section */}
        <div className="bg-background p-3 max-h-48 overflow-y-auto">
          {scanResult ? (
            <div className={`p-3 rounded-lg border ${getStatusColorClass()}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon()}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{scanResult.message}</p>
                  
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {scanResult.value && (
                      <p>Código: <span className="font-medium text-foreground font-mono">{scanResult.value}</span></p>
                    )}
                    {scanResult.encomendado && (
                      <p>Encomendado: <span className="font-medium text-foreground">{scanResult.encomendado}</span></p>
                    )}
                    {scanResult.bultos !== undefined && (
                      <p>Bultos: <span className="font-medium text-foreground">{scanResult.bultos}</span></p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : lastScannedCode ? (
            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">Procesando código: <span className="font-mono">{lastScannedCode}</span></p>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-dashed text-center">
              <p className="text-sm text-muted-foreground">
                Los resultados del escaneo aparecerán aquí
              </p>
            </div>
          )}
        </div>

        {/* CSS for scan line animation */}
        <style>{`
          @keyframes scan-line {
            0%, 100% { transform: translateY(-20px); opacity: 0.5; }
            50% { transform: translateY(20px); opacity: 1; }
          }
          #${SCANNER_CONTAINER_ID} video {
            width: 100% !important;
            height: auto !important;
            object-fit: cover !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScannerDialog;
