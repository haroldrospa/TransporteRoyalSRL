import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Keyboard, KeyboardOff, Loader2, Camera, CameraOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import InlineCameraScanner from './InlineCameraScanner';
import { ScanResult } from '@/hooks/use-scanner';

interface ScanInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan: (directValue?: string) => void;
  scanType: 'conduce' | 'bulto';
  inputRef: React.RefObject<HTMLInputElement>;
  isProcessing: boolean;
  scanResult?: ScanResult | null;
}

const ScanInput = ({ value, onChange, onScan, scanType, inputRef, isProcessing, scanResult }: ScanInputProps) => {
  const isMobile = useIsMobile();
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Helper para mantener el foco de forma segura sin saltos de scroll
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [inputRef]);

  // Mantener foco siempre: al montar, al cambiar scanType y al terminar cada escaneo
  useEffect(() => {
    if (!isProcessing) {
      focusInput();
      const timer1 = setTimeout(focusInput, 30);
      const timer2 = setTimeout(focusInput, 100);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isProcessing, scanType, keyboardEnabled, focusInput]);

  // Foco inicial garantizado
  useEffect(() => {
    focusInput();
    const timer = setTimeout(focusInput, 150);
    return () => clearTimeout(timer);
  }, [focusInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onScan(value);
      // Garantizar que el foco nunca se pierda tras presionar Enter o pistolear
      requestAnimationFrame(focusInput);
      setTimeout(focusInput, 50);
      setTimeout(focusInput, 150);
    }
  };

  const handleCameraScan = (scannedValue: string) => {
    onChange(scannedValue);
    onScan(scannedValue);
    setTimeout(focusInput, 50);
  };

  const toggleCameraScanner = () => {
    setShowCameraScanner(!showCameraScanner);
    setTimeout(focusInput, 50);
  };

  const toggleKeyboard = () => {
    const nextState = !keyboardEnabled;
    setKeyboardEnabled(nextState);
    setTimeout(focusInput, 50);
  };

  const handleProcessScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onScan(value);
    focusInput();
    setTimeout(focusInput, 50);
    setTimeout(focusInput, 150);
  };

  return (
    <div className="space-y-2 relative">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input 
            ref={inputRef}
            type="text"
            inputMode={isMobile && !keyboardEnabled ? 'none' : 'text'}
            placeholder={`Escanear ${scanType === 'conduce' ? 'número de conduce' : 'número de bulto'}...`}
            className="pr-10 h-11 text-sm bg-muted/20 border-border/70 rounded-xl focus-visible:ring-royal-blue/30 focus:border-royal-blue"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            autoFocus
            readOnly={isProcessing}
          />
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 transition-colors ${
                keyboardEnabled ? 'text-royal-blue bg-royal-blue/10' : 'text-muted-foreground'
              }`}
              onClick={toggleKeyboard}
              disabled={isProcessing}
              title={keyboardEnabled ? "Ocultar teclado" : "Escribir con teclado"}
            >
              {keyboardEnabled ? <KeyboardOff className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        {/* Camera scan toggle button */}
        <Button
          variant={showCameraScanner ? "default" : "outline"}
          size="icon"
          className={`h-11 w-11 flex-shrink-0 rounded-xl transition-all ${
            showCameraScanner 
              ? 'bg-royal-blue text-white shadow-sm hover:bg-royal-blue/90' 
              : 'border-border/80 text-foreground hover:bg-muted/50 hover:text-royal-blue'
          }`}
          onClick={toggleCameraScanner}
          disabled={isProcessing}
          title={showCameraScanner ? "Cerrar cámara" : "Abrir cámara para escanear"}
        >
          {showCameraScanner ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </Button>
      </div>

      {/* Embedded Inline Camera Scanner View */}
      {showCameraScanner && (
        <InlineCameraScanner
          scanType={scanType}
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
      
      <Button 
        className={`w-full py-5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
          isProcessing 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : 'bg-royal-blue hover:bg-royal-blue/90 text-white active:scale-[0.99]'
        }`}
        onClick={handleProcessScanClick}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Procesando escaneo...</span>
          </div>
        ) : (
          'Procesar Escaneo'
        )}
      </Button>
      
      {isProcessing && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center rounded-xl z-30 pointer-events-none">
          <div className="bg-card border border-border/80 p-3.5 shadow-lg rounded-xl flex items-center space-x-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-royal-blue" />
            <span className="text-foreground text-xs font-semibold">Procesando escaneo...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanInput;
