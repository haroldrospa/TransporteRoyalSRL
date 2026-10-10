import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  Send,
  Wifi,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import {
  enviarComandoArduino,
  obtenerEstadoArduino,
  obtenerArduinoDebug,
  type ArduinoDebugInfo,
} from '@/services/arduinoService';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';

interface ArduinoControlPanelProps {
  activeRoutes?: string[];
  className?: string;
}

const DEFAULT_ROUTES = [
  'R-01',
  'R-02',
  'R-03',
  'R-04',
  'R-05',
  'R-06',
  'R-07',
  'R-08',
  'R-09',
  'C-01',
];

export const ArduinoControlPanel: React.FC<ArduinoControlPanelProps> = ({
  activeRoutes,
  className = '',
}) => {
  const [estadoActual, setEstadoActual] = useState<string>('NADA');
  const [debugInfo, setDebugInfo] = useState<ArduinoDebugInfo | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [customCommand, setCustomCommand] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de rutas combinadas
  const routesToDisplay = React.useMemo(() => {
    if (!activeRoutes || activeRoutes.length === 0) return DEFAULT_ROUTES;
    const set = new Set([...activeRoutes, ...DEFAULT_ROUTES]);
    return Array.from(set).filter(
      (r) => r && r !== 'Almacen' && r !== 'No asignado'
    );
  }, [activeRoutes]);

  // Polling del estado de Arduino
  useEffect(() => {
    let isMounted = true;

    const checkState = async () => {
      const state = await obtenerEstadoArduino();
      const debug = await obtenerArduinoDebug();
      if (isMounted) {
        setEstadoActual(state);
        if (debug) setDebugInfo(debug);
      }
    };

    checkState();
    const interval = setInterval(checkState, 1000);

    const handleLocalCommand = (e: any) => {
      const { comando, autoReset, duracionMs } = e.detail || {};
      if (comando) {
        setEstadoActual(comando);
        if (autoReset) {
          startCountdown(duracionMs || 2000);
        } else {
          stopCountdown();
        }
      }
    };

    window.addEventListener('arduino-command-sent', handleLocalCommand);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('arduino-command-sent', handleLocalCommand);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startCountdown = (durationMs: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const startTime = Date.now();
    setCountdown(durationMs / 1000);

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setCountdown(parseFloat(remaining.toFixed(1)));

      if (elapsed >= durationMs) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        setEstadoActual('NADA');
      }
    }, 100);
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const handleSendCommand = async (cmd: string) => {
    if (isSending) return;
    setIsSending(true);

    try {
      const success = await enviarComandoArduino(cmd);
      if (success) {
        toast({
          title: `Comando enviado: ${cmd}`,
          description:
            cmd === 'CINTA_ON'
              ? 'Cinta transportadora iniciada.'
              : cmd === 'CINTA_OFF'
              ? 'Cinta transportadora detenida.'
              : cmd === 'NADA'
              ? 'Estado en reposo (NADA).'
              : `Compuerta ${cmd} abierta (Auto-cierre en 2s).`,
          duration: 2500,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim()) return;
    handleSendCommand(customCommand.trim().toUpperCase());
    setCustomCommand('');
  };

  // Sanitización de seguridad: si el backend devuelve HTML o un texto inesperado, mostrar NADA
  const cleanEstado = (estadoActual || '').trim();
  const displayEstado =
    !cleanEstado ||
    cleanEstado.length > 20 ||
    cleanEstado.includes('<') ||
    cleanEstado.includes('DOCTYPE') ||
    cleanEstado.includes('html')
      ? 'NADA'
      : cleanEstado;

  const isCintaOn = displayEstado === 'CINTA_ON';
  const isCintaOff = displayEstado === 'CINTA_OFF';
  const isTruckActive =
    displayEstado !== 'NADA' && !isCintaOn && !isCintaOff && displayEstado !== '';

  const { user } = useAuth();
  const isAdmin = isAdministrator(user);

  // Solo los usuarios con rol o nivel de Administrador pueden ver este panel
  if (!isAdmin) {
    return null;
  }

  return (
    <Card className={`bg-white border border-border/70 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 ${className}`}>
      {/* 1. Header Minimalista y Barra de Estado */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-royal-blue flex items-center justify-center border border-blue-100/80 shadow-xs">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Control de Transportador
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                ESP8266
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sincronización en tiempo real con cinta y compuertas físicas
            </p>
          </div>
        </div>

        {/* Píldoras de Estado en Tiempo Real */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Estado de Conexión del ESP8266 */}
          {debugInfo?.isConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ESP8266 Conectado</span>
              <span className="text-[10px] text-emerald-600/70 font-mono hidden sm:inline">
                ({debugInfo.lastClientIp})
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>ESP8266 Desconectado</span>
            </div>
          )}

          {/* Badge del Comando Activo */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shadow-xs ${
              isCintaOn
                ? 'bg-royal-blue text-white ring-2 ring-blue-900/20'
                : isCintaOff
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : isTruckActive
                ? 'bg-royal-blue text-royal-yellow border border-blue-900 shadow-sm animate-pulse'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Radio className={`h-3 w-3 ${isCintaOn || isTruckActive ? 'animate-spin' : ''}`} />
            <span>{displayEstado}</span>
            {countdown !== null && (
              <span className="text-[10px] font-normal text-royal-yellow ml-0.5">
                ({countdown}s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sección de Controles en 2 Filas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Columna Izquierda (5 cols): Cinta Transportadora */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cinta Transportadora
            </span>
            <span className="text-[10px] text-slate-400">Permanente</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Arrancar Cinta */}
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSendCommand('CINTA_ON')}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCintaOn
                  ? 'bg-royal-blue text-white shadow-sm ring-2 ring-royal-blue/30'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Arrancar</span>
            </button>

            {/* Botón Detener / Pausar */}
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSendCommand('CINTA_OFF')}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCintaOff
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pausar</span>
            </button>

            {/* Botón Reset */}
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSendCommand('NADA')}
              title="Restaurar a reposo (NADA)"
              className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Separador vertical para pantallas grandes */}
        <div className="hidden lg:block w-px h-12 bg-slate-200/80 mx-auto" />

        {/* Columna Derecha (6 cols): Compuertas por Ruta */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Compuertas por Ruta
            </span>
            <span className="text-[10px] text-royal-blue font-medium bg-blue-50 px-2 py-0.5 rounded-full">
              Auto-cierre 2s
            </span>
          </div>

          {/* Chips horizontales de rutas */}
          <div className="flex flex-wrap items-center gap-1.5">
            {routesToDisplay.map((route) => {
              const isActive = estadoActual === route;
              return (
                <button
                  key={route}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendCommand(route)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-royal-blue text-white shadow-sm scale-105 font-bold border border-royal-blue'
                      : 'bg-slate-50 hover:bg-blue-50 hover:text-royal-blue hover:border-blue-200 border border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{route}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Footer Sutil: Comando manual y enlace a configuración */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Comando manual rápido */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Otro comando..."
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            className="h-8 text-xs font-mono uppercase w-36 bg-slate-50 border-slate-200"
          />
          <button
            type="submit"
            disabled={isSending || !customCommand.trim()}
            className="h-8 px-2.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white inline-flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>Enviar</span>
          </button>
        </form>

        {/* Toggle para ver datos técnicos */}
        <button
          type="button"
          onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
          className="text-[11px] text-slate-500 hover:text-royal-blue inline-flex items-center gap-1 transition-colors cursor-pointer ml-auto"
        >
          <Wifi className="h-3 w-3 text-slate-400" />
          <span>Configuración ESP8266</span>
          {showTechnicalInfo ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* 4. Panel Técnico Desplegable (Limpio y Discreto) */}
      {showTechnicalInfo && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-sans text-xs space-y-2.5 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">URL del ESP8266:</span>
              <code className="px-2 py-0.5 rounded bg-white border border-slate-200 text-royal-blue font-mono text-[11px]">
                http://{typeof window !== 'undefined' ? window.location.hostname : '192.168.100.168'}:5000/api/estado_arduino
              </code>
            </div>
            <button
              type="button"
              onClick={() => {
                const host = window.location.hostname;
                const url = `http://${host}:5000/api/estado_arduino`;
                navigator.clipboard.writeText(url);
                setCopiedUrl(true);
                toast({ title: 'URL copiada al portapapeles' });
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="text-[11px] px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 inline-flex items-center gap-1 text-slate-700 transition-colors cursor-pointer"
            >
              {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>Copiar URL</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            El microcontrolador ESP8266 consulta esta dirección cada 1 segundo en texto plano para mover los servomotores físicos de la maqueta.
          </p>
        </div>
      )}
    </Card>
  );
};

export default ArduinoControlPanel;
