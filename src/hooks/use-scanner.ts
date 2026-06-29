
import { useState, useRef, useEffect } from 'react';
import { Conduce } from '@/types/conduces';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to emit status messages
const emitStatusMessage = (text: string, type: 'success' | 'info' | 'warning' | 'error') => {
  const event = new CustomEvent('scan-status-message', {
    detail: { text, type }
  });
  window.dispatchEvent(event);
};

export interface ScanResult {
  type: 'success' | 'duplicate' | 'error';
  message: string;
  value?: string;
  encomendado?: string;
  bultos?: number;
}

interface UseScannerProps {
  conduces: Conduce[];
  scannedConduces: Record<string, string[]>;
  scannedBultos: Record<string, number>;
  scannedBultoIds: Record<string, string[]>;
  onScanConduce: (encomendado: string, conduceNumber: string) => void;
  onScanBulto: (encomendado: string, bultoId: string, conduceNumber: string) => void;
  onNotFound: (scanValue: string, scanType: 'conduce' | 'bulto') => void;
  onUpdateScanValue: (value: string, type: 'conduce' | 'bulto') => void;
  isProcessing: boolean;
  selectedRelacion?: string;
}

export const useScanner = ({
  conduces,
  scannedConduces,
  scannedBultos,
  scannedBultoIds,
  onScanConduce,
  onScanBulto,
  onNotFound,
  onUpdateScanValue,
  isProcessing,
  selectedRelacion
}: UseScannerProps) => {
  const { user } = useAuth();
  const isDespachador = user?.puesto === 'Despachador';
  
  const [scanValue, setScanValue] = useState('');
  const [scanType, setScanType] = useState<'conduce' | 'bulto'>(isDespachador ? 'bulto' : 'conduce');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  // Focus input after scan completion and preserve scroll position
  useEffect(() => {
    // If not processing and input exists, focus it
    if (!isProcessing && inputRef.current) {
      // Wait for processing overlay to disappear
      setTimeout(() => {
        if (inputRef.current) {
          const currentPosition = window.scrollY;
          inputRef.current.focus();
          
          // If on mobile and we have a stored position, restore it
          if (lastScrollPosition > 0) {
            window.scrollTo(0, lastScrollPosition);
            setLastScrollPosition(0); // Reset after use
          }
        }
      }, 100);
    }
  }, [isProcessing, lastScrollPosition]);

  // Update the parent component with current scan value and type
  const handleScanValueChange = (value: string) => {
    setScanValue(value);
    onUpdateScanValue(value, scanType);
  };

  // Update scan type and notify parent
  const handleScanTypeChange = (type: 'conduce' | 'bulto') => {
    setScanType(type);
    onUpdateScanValue(scanValue, type);
    // Focus input when changing scan type
    if (inputRef.current) {
      // Save position before focus to prevent unwanted scrolling
      setLastScrollPosition(window.scrollY);
      inputRef.current.focus();
    }
  };

  const handleScan = () => {
    // Store scroll position before any processing
    setLastScrollPosition(window.scrollY);
    
    if (isProcessing) {
      return;
    }

    const normalizedValue = scanValue.trim();

    if (!normalizedValue) {
      emitStatusMessage('Por favor ingrese un valor para escanear', 'warning');
      return;
    }

    // Validate that a relation is selected when scanning conduces
    if (scanType === 'conduce' && !selectedRelacion) {
      emitStatusMessage('Debe seleccionar una relación antes de escanear conduces', 'error');
      return;
    }

    onUpdateScanValue(normalizedValue, scanType);

    // IMPORTANT:
    // - We still try to resolve the conduce locally to display friendly info
    // - But we ALWAYS delegate the final decision (duplicate/delivered/unassigned/notFound)
    //   to the parent handlers, which also consult local refs + DB.
    const bultoConduceNumber = normalizedValue.includes('-')
      ? normalizedValue.split('-')[0]
      : normalizedValue;

    const localConduce = conduces.find((c) =>
      c.numeroConduce === (scanType === 'bulto' ? bultoConduceNumber : normalizedValue)
    );

    const encomendado = localConduce?.encomendado || '';

    // Anunciar por voz el encomendado al que está asignado (si está activado en config)
    const voiceEnabled = localStorage.getItem('cargarCamionesVoiceEnabled') !== 'false';
    if (voiceEnabled && encomendado && 'speechSynthesis' in window) {
      try {
        const rate = parseFloat(localStorage.getItem('cargarCamionesVoiceRate') || '1') || 1;
        const pitch = parseFloat(localStorage.getItem('cargarCamionesVoicePitch') || '1') || 1;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(encomendado);
        utterance.lang = 'es-ES';
        utterance.rate = Math.min(2, Math.max(0.5, rate));
        utterance.pitch = Math.min(2, Math.max(0, pitch));
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Voice announcement failed:', e);
      }
    }

    if (scanType === 'conduce') {
      setScanResult({
        type: 'success',
        message: 'Procesando conduce...',
        value: normalizedValue,
        encomendado: encomendado || undefined,
        bultos: localConduce?.cantidadBultos,
      });

      // Always call the handler so the UI result box gets updated (duplicate/notFound/etc.).
      onScanConduce(encomendado, normalizedValue);
    } else {
      // For bultos, we pass the RAW scanned value as bultoId.
      // The handler will auto-asign bulto_sequence when the barcode doesn't include it.
      setScanResult({
        type: 'success',
        message: 'Procesando bulto...',
        value: normalizedValue,
        encomendado: encomendado || undefined,
      });

      onScanBulto(encomendado, normalizedValue, bultoConduceNumber);
    }
    
    setScanValue('');
    // Input will be auto-focused after processing completes due to the useEffect
  };

  return {
    scanValue,
    setScanValue: handleScanValueChange,
    scanType,
    setScanType: handleScanTypeChange,
    handleScan,
    inputRef,
    scanResult
  };
};
