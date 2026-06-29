
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Keyboard, KeyboardOff, Loader2, Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import CameraScannerDialog from './CameraScannerDialog';

import { ScanResult } from '@/hooks/use-scanner';

interface ScanInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  scanType: 'conduce' | 'bulto';
  inputRef: React.RefObject<HTMLInputElement>;
  isProcessing: boolean;
  scanResult?: ScanResult | null;
}

const ScanInput = ({ value, onChange, onScan, scanType, inputRef, isProcessing, scanResult }: ScanInputProps) => {
  const isMobile = useIsMobile();
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraInitError, setCameraInitError] = useState<string | null>(null);

  // Effect to focus the input when keyboard is enabled or after processing
  useEffect(() => {
    if ((keyboardEnabled && isMobile) || !isProcessing) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          
          // Prevent scroll jumping on mobile
          if (isMobile) {
            // Save current position
            const scrollPosition = window.scrollY;
            
            // Focus input with readonly attribute initially to prevent keyboard from showing
            if (!keyboardEnabled) {
              inputRef.current.setAttribute('readonly', 'readonly');
            } else {
              inputRef.current.removeAttribute('readonly');
            }
            
            inputRef.current.focus();
            
            // If readonly was set, remove it after focus to allow typing
            if (!keyboardEnabled && inputRef.current.hasAttribute('readonly')) {
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.removeAttribute('readonly');
                }
              }, 100);
            }
            
            // Restore position after a short delay
            setTimeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 50);
          } else {
            inputRef.current.focus();
          }
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [keyboardEnabled, isMobile, isProcessing]);

  // Handle processing completion
  useEffect(() => {
    if (!isProcessing && inputRef.current && document.activeElement !== inputRef.current) {
      // Only attempt to focus if we're not already focused on the input
      const scrollPosition = window.scrollY;
      
      // Set readonly to prevent keyboard from showing
      if (!keyboardEnabled && isMobile) {
        inputRef.current.setAttribute('readonly', 'readonly');
      }
      
      inputRef.current.focus();
      
      // Remove readonly after focus to allow typing
      if (!keyboardEnabled && isMobile && inputRef.current.hasAttribute('readonly')) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.removeAttribute('readonly');
          }
        }, 100);
      }
      
      if (isMobile) {
        window.scrollTo(0, scrollPosition);
      }
    }
  }, [isProcessing, isMobile, keyboardEnabled]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault(); // Prevent form submission
      const scrollPosition = window.scrollY;
      onScan();
      if (isMobile) {
        // Keep the page position after scan
        setTimeout(() => window.scrollTo(0, scrollPosition), 50);
      }
    }
  };

  const handleCameraScan = (scannedValue: string) => {
    onChange(scannedValue);
    // Small delay to ensure value is set before scanning
    setTimeout(() => {
      onScan();
    }, 100);
  };

  const getCameraInitErrorMessage = (err: any) => {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Permiso de cámara denegado. Actívalo en el navegador y vuelve a intentar.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'No se encontró una cámara en este dispositivo.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'La cámara está siendo usada por otra app o pestaña. Cierra otras apps e intenta de nuevo.';
    }
    if (name === 'SecurityError') {
      return 'El navegador bloqueó la cámara por seguridad. Abre la app usando HTTPS.';
    }
    return 'No se pudo acceder a la cámara. Verifica los permisos.';
  };

  const handleOpenCameraScanner = useCallback(async () => {
    setCameraInitError(null);

    // Request permission from a user gesture (this click) to avoid browser blocks.
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraInitError('Este navegador no soporta acceso a cámara.');
        setShowCameraScanner(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((t) => t.stop());

      setShowCameraScanner(true);
    } catch (err: any) {
      setCameraInitError(getCameraInitErrorMessage(err));
      setShowCameraScanner(true);
    }
  }, []);


  return (
    <div className="space-y-2 relative">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input 
            ref={inputRef}
            type="text"
            placeholder={`Escanear ${scanType === 'conduce' ? 'número de conduce' : 'número de bulto'}...`}
            className="pr-10"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            autoFocus={!isMobile || keyboardEnabled}
            disabled={isProcessing}
          />
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setKeyboardEnabled(!keyboardEnabled)}
              disabled={isProcessing}
            >
              {keyboardEnabled ? <KeyboardOff className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        {/* Camera scan button */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 flex-shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleOpenCameraScanner}
          disabled={isProcessing}
          title="Escanear con cámara"
        >
          <Camera className="h-5 w-5" />
        </Button>
      </div>
      
      <Button 
        className={`w-full py-6 ${
          isProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-[#0A1D3F] hover:bg-[#152C4F]'
        } text-white`}
        onClick={() => {
          // Save scroll position before scan
          const scrollPosition = window.scrollY;
          onScan();
          if (isMobile) {
            // Restore position after scan
            setTimeout(() => window.scrollTo(0, scrollPosition), 50);
          }
        }}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Procesando...
          </div>
        ) : (
          'Procesar Escaneo'
        )}
      </Button>
      
      {isProcessing && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded">
          <div className="bg-white p-4 shadow-lg rounded-lg flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">Procesando escaneo...</span>
          </div>
        </div>
      )}

      {/* Camera Scanner Dialog */}
      <CameraScannerDialog
        open={showCameraScanner}
        onOpenChange={(nextOpen) => {
          setShowCameraScanner(nextOpen);
          if (!nextOpen) setCameraInitError(null);
        }}
        scanType={scanType}
        onScan={handleCameraScan}
        scanResult={scanResult}
        initialError={cameraInitError}
      />
    </div>
  );
};

export default ScanInput;
