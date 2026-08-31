import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Volume2, VolumeX, Loader2, RefreshCw, Zap, ZapOff, ZoomIn, ZoomOut, Check, Info } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface InlineCameraScannerProps {
  scanType: 'conduce' | 'bulto';
  onScan: (value: string) => void;
  onClose: () => void;
}

const INLINE_SCANNER_CONTAINER_ID = 'inline-camera-scanner-container';

const InlineCameraScanner: React.FC<InlineCameraScannerProps> = ({
  scanType,
  onScan,
  onClose,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  
  // Torch and Zoom controls
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [justScanned, setJustScanned] = useState(false);

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
      oscillator.frequency.value = 1100;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {
      // Audio not supported
    }
  }, []);

  // Vibrate on scan
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }, []);

  // User-friendly error message
  const getCameraErrorMessage = useCallback((err: any): string => {
    const name = err?.name || '';
    const message = typeof err === 'string' ? err : err?.message || '';
    const combined = `${name} ${message}`.toLowerCase();
    
    if (name === 'NotAllowedError' || combined.includes('denied') || combined.includes('permission')) {
      return 'Permiso de cámara denegado. Habilítalo en la configuración de Chrome.';
    }
    if (name === 'NotFoundError' || combined.includes('not found')) {
      return 'No se encontró una cámara en este dispositivo.';
    }
    if (name === 'NotReadableError' || combined.includes('in use') || combined.includes('busy')) {
      return 'La cámara está siendo usada por otra app. Ciérrala y reintenta.';
    }
    if (name === 'SecurityError' || combined.includes('secure')) {
      return 'El navegador bloqueó la cámara. Usa HTTPS.';
    }
    
    return 'No se pudo acceder a la cámara. Verifica los permisos.';
  }, []);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Handle detected barcode
  const handleCodeDetected = useCallback((code: string) => {
    if (scanCooldownRef.current) return;
    
    scanCooldownRef.current = true;
    setLastScannedCode(code);
    setJustScanned(true);
    
    playBeep();
    vibrate();
    
    console.log('📷 [InlineScanner] Barcode detected:', code);
    onScanRef.current(code);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setJustScanned(false);
      }
    }, 800);

    // Quick cooldown to prevent accidental rapid re-scans of the same item
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1400);
  }, [playBeep, vibrate]);

  // Check hardware capabilities (Torch / Zoom)
  const inspectCameraCapabilities = useCallback(() => {
    try {
      const video = document.querySelector(`#${INLINE_SCANNER_CONTAINER_ID} video`) as HTMLVideoElement;
      const stream = video?.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const caps: any = track.getCapabilities();
        setTorchSupported(!!caps.torch);
        setZoomSupported(!!caps.zoom);
      } else {
        // Fallback CSS zoom supported on all devices
        setZoomSupported(true);
      }
    } catch {
      setZoomSupported(true);
    }
  }, []);

  // Start scanner
  const startScanner = useCallback(async (cameraIdx = 0) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      setError(null);
      await stopScanner();
      await new Promise(r => setTimeout(r, 100));

      const container = document.getElementById(INLINE_SCANNER_CONTAINER_ID);
      if (!container) return;
      container.innerHTML = '';

      const scanner = new Html5Qrcode(INLINE_SCANNER_CONTAINER_ID, {
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
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });

      scannerRef.current = scanner;

      let cameras: any[] = [];
      try {
        const rawCameras = await Html5Qrcode.getCameras();
        if (rawCameras && rawCameras.length > 0) {
          // Sort cameras so rear/back cameras are ALWAYS index 0
          cameras = [...rawCameras].sort((a, b) => {
            const aIsBack = /back|rear|trasera|environment|0/i.test(a.label);
            const bIsBack = /back|rear|trasera|environment|0/i.test(b.label);
            if (aIsBack && !bIsBack) return -1;
            if (!aIsBack && bIsBack) return 1;
            return 0;
          });
          setAvailableCameras(cameras);
        }
      } catch (camErr) {
        console.warn('getCameras note:', camErr);
      }

      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

      // 720p is optimal for barcode scanning: low CPU usage, high contrast, fast frame rate
      const config = {
        fps: 25,
        disableFlip: true,
        videoConstraints: {
          facingMode: isMobile ? { ideal: 'environment' } : 'user',
          width: { min: 640, ideal: 1280, max: 1280 },
          height: { min: 480, ideal: 720, max: 720 },
          advanced: [
            { focusMode: 'continuous' },
            { exposureMode: 'continuous' },
            { whiteBalanceMode: 'continuous' }
          ] as any
        }
      };

      const successCallback = (decodedText: string) => {
        handleCodeDetected(decodedText);
      };

      if (cameras.length > 0) {
        const targetCam = cameras[cameraIdx] || cameras.find(c => /back|rear|trasera|environment/i.test(c.label)) || cameras[0];
        try {
          await scanner.start(targetCam.id, config, successCallback, () => {});
        } catch {
          await scanner.start({ facingMode: 'environment' }, config, successCallback, () => {});
        }
      } else {
        try {
          await scanner.start({ facingMode: isMobile ? 'environment' : 'user' }, config, successCallback, () => {});
        } catch {
          await scanner.start({ facingMode: 'user' }, config, successCallback, () => {});
        }
      }

      if (isMountedRef.current) {
        setIsScanning(true);
        setTimeout(inspectCameraCapabilities, 300);

        // Start hardware accelerated BarcodeDetector fast loop if browser supports it (Chromium / Android)
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const supportedFormats: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
            const targetFormats = supportedFormats.filter(f => 
              ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'qr_code'].includes(f)
            );
            const nativeDetector = new (window as any).BarcodeDetector({ formats: targetFormats });

            let loopRunning = true;
            const runFastDetector = async () => {
              if (!loopRunning || !isMountedRef.current) return;
              try {
                const videoEl = document.querySelector(`#${INLINE_SCANNER_CONTAINER_ID} video`) as HTMLVideoElement;
                if (videoEl && videoEl.readyState >= 2 && !videoEl.paused) {
                  const codes = await nativeDetector.detect(videoEl);
                  if (codes && codes.length > 0 && codes[0].rawValue) {
                    handleCodeDetected(codes[0].rawValue);
                  }
                }
              } catch {
                // Ignore single frame detect errors
              }
              if (loopRunning && isMountedRef.current) {
                setTimeout(runFastDetector, 40); // 25 times per second parallel hardware detector
              }
            };
            runFastDetector();
          } catch (nativeErr) {
            console.warn('Native BarcodeDetector init note:', nativeErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Error starting inline scanner:', err);
      if (isMountedRef.current) {
        setError(getCameraErrorMessage(err));
        setIsScanning(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanner, handleCodeDetected, getCameraErrorMessage, inspectCameraCapabilities]);

  const switchCamera = () => {
    if (availableCameras.length > 1) {
      const nextIdx = (activeCameraIndex + 1) % availableCameras.length;
      setActiveCameraIndex(nextIdx);
      startScanner(nextIdx);
    }
  };

  const toggleTorch = async () => {
    try {
      const video = document.querySelector(`#${INLINE_SCANNER_CONTAINER_ID} video`) as HTMLVideoElement;
      const stream = video?.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch } as any]
        });
        setTorchOn(nextTorch);
      }
    } catch (e) {
      console.warn('Torch toggle not supported on this track:', e);
    }
  };

  const toggleZoom = async () => {
    const nextZoom = zoomLevel === 1 ? 1.7 : 1;
    setZoomLevel(nextZoom);
    try {
      const video = document.querySelector(`#${INLINE_SCANNER_CONTAINER_ID} video`) as HTMLVideoElement;
      const stream = video?.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({
          advanced: [{ zoom: nextZoom } as any]
        });
      }
    } catch {
      // Handled via CSS zoom transform
    }
  };

  useEffect(() => {
    startScanner(0);
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="rounded-xl border border-royal-blue/40 overflow-hidden bg-black shadow-md animate-fade-in my-2.5">
      {/* Top Inline Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-white/10 text-white">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 rounded bg-royal-blue/30 text-blue-400">
            <Camera className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-bold tracking-wide">
            Cámara {scanType === 'conduce' ? 'Conduces' : 'Bultos'}
          </span>
          {isScanning && (
            <span className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border transition-all ${
              justScanned 
                ? 'bg-emerald-500 text-white border-emerald-400 scale-105' 
                : 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
            }`}>
              {justScanned ? (
                <>
                  <Check className="h-2.5 w-2.5" />
                  ¡Capturado!
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Lista
                </>
              )}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          {/* Torch / Flashlight Toggle (Always available) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTorch}
            className={`h-6 px-1.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
              torchOn 
                ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-xs' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={torchOn ? "Apagar linterna / flash" : "Encender linterna / flash"}
          >
            {torchOn ? <Zap className="h-3.5 w-3.5 fill-current text-black" /> : <ZapOff className="h-3.5 w-3.5 text-amber-400" />}
            <span>Flash</span>
          </Button>

          {/* Zoom Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleZoom}
            className={`h-6 px-1.5 text-[10px] font-bold rounded flex items-center gap-0.5 ${
              zoomLevel > 1 
                ? 'bg-royal-blue text-white' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Alternar Zoom 1x / 2x"
          >
            {zoomLevel > 1 ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
            <span>{zoomLevel > 1 ? '1.7x' : '1x'}</span>
          </Button>

          {/* Switch Camera Button */}
          {availableCameras.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded"
              title="Cambiar cámara (Trasera / Frontal)"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded"
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? (
              <Volume2 className="h-3 w-3 text-emerald-400" />
            ) : (
              <VolumeX className="h-3 w-3 text-white/40" />
            )}
          </Button>

          {/* Close Camera */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-white/70 hover:text-rose-400 hover:bg-white/10 rounded"
            title="Cerrar cámara"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Rectangular Barcode Slit Viewport */}
      <div className="relative bg-black h-[105px] sm:h-[115px] overflow-hidden flex items-center justify-center">
        <div 
          id={INLINE_SCANNER_CONTAINER_ID} 
          className="w-full h-full transition-transform duration-300"
          style={{ transform: zoomLevel > 1 ? `scale(${zoomLevel})` : 'none' }}
        />

        {/* Crisp Laser & Frame Overlay */}
        {isScanning && (
          <div className={`absolute inset-1.5 pointer-events-none rounded-lg border transition-all z-10 ${
            justScanned ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'border-white/30'
          }`}>
            {/* Animated Laser Line */}
            <div 
              className={`absolute left-0 right-0 h-0.5 transition-colors ${
                justScanned 
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]' 
                  : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]'
              }`}
              style={{
                top: '50%',
                animation: 'slit-scan-laser 1.8s ease-in-out infinite'
              }}
            />
            
            {/* 4 Corner Markers */}
            <div className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-sm transition-colors ${
              justScanned ? 'border-emerald-300' : 'border-emerald-400'
            }`} />
            <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-sm transition-colors ${
              justScanned ? 'border-emerald-300' : 'border-emerald-400'
            }`} />
            <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-sm transition-colors ${
              justScanned ? 'border-emerald-300' : 'border-emerald-400'
            }`} />
            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-sm transition-colors ${
              justScanned ? 'border-emerald-300' : 'border-emerald-400'
            }`} />
          </div>
        )}

        {/* Loading State */}
        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 gap-2">
            <Loader2 className="h-5 w-5 text-royal-blue animate-spin" />
            <p className="text-white text-xs">Iniciando cámara...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 p-2.5 text-center z-20 gap-2">
            <Camera className="h-5 w-5 text-white/50" />
            <p className="text-white text-xs font-medium truncate max-w-[220px]">{error}</p>
            <Button
              onClick={() => startScanner(activeCameraIndex)}
              variant="secondary"
              size="sm"
              className="h-6 text-[10px] px-2.5 py-0"
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Smart Guidance & Distance Hint Strip */}
      <div className="px-3 py-1 bg-slate-950/95 border-t border-white/10 flex items-center justify-between text-[10.5px] text-white/90">
        <div className="flex items-center gap-1.5 min-w-0">
          <Info className="h-3 w-3 text-royal-blue shrink-0" />
          <span className="truncate text-slate-300">
            Distancia ideal: <strong className="text-white font-semibold">15 a 20 cm</strong> (centra la línea roja)
          </span>
        </div>
        {lastScannedCode && (
          <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">
            {lastScannedCode}
          </span>
        )}
      </div>

      {/* Global CSS for Slim Scanner */}
      <style>{`
        @keyframes slit-scan-laser {
          0%, 100% { transform: translateY(-20px); opacity: 0.6; }
          50% { transform: translateY(20px); opacity: 1; }
        }
        #${INLINE_SCANNER_CONTAINER_ID} {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        #${INLINE_SCANNER_CONTAINER_ID} #qr-shaded-region {
          display: none !important;
        }
        #${INLINE_SCANNER_CONTAINER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default InlineCameraScanner;
