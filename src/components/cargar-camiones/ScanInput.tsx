import React, { useState, useEffect } from 'react';
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

  // Only focus when keyboard is explicitly toggled ON by user or on desktop
  useEffect(() => {
    if (keyboardEnabled && isMobile && inputRef.current) {
      inputRef.current.focus();
    } else if (!isMobile && !isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [keyboardEnabled, isMobile, isProcessing]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const scrollPosition = window.scrollY;
      onScan(value);
      if (isMobile && !keyboardEnabled) {
        inputRef.current?.blur();
      }
      if (isMobile) {
        setTimeout(() => window.scrollTo(0, scrollPosition), 50);
      }
    }
  };

  const handleCameraScan = (scannedValue: string) => {
    if (isMobile) {
      inputRef.current?.blur();
    }
    onChange(scannedValue);
    // Execute scan immediately with the scanned value!
    onScan(scannedValue);
  };

  const toggleCameraScanner = () => {
    if (isMobile) {
      inputRef.current?.blur();
    }
    setShowCameraScanner(!showCameraScanner);
  };

  const toggleKeyboard = () => {
    const nextState = !keyboardEnabled;
    setKeyboardEnabled(nextState);
    if (nextState) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      inputRef.current?.blur();
    }
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
            className="pr-10 h-11 text-sm bg-muted/20 border-border/70 rounded-xl focus-visible:ring-royal-blue/30"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            autoFocus={!isMobile}
            disabled={isProcessing}
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
        onClick={() => {
          const scrollPosition = window.scrollY;
          onScan(value);
          if (isMobile) {
            setTimeout(() => window.scrollTo(0, scrollPosition), 50);
          }
        }}
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
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center rounded-xl z-30">
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
