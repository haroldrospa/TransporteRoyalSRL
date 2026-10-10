/**
 * Estado en memoria del sistema Arduino (ESP8266).
 * 
 * Reglas de negocio:
 * 1. Por defecto el estado es "NADA".
 * 2. Si el comando es un camión/ruta (ej. R-01, R-07), se guarda ese estado y
 *    automáticamente después de 2 segundos se restaura a "NADA".
 * 3. Si el comando es CINTA_ON o CINTA_OFF, el estado se queda fijo sin auto-limpiarse.
 */

let estadoActual = 'NADA';
let autoResetTimer: NodeJS.Timeout | null = null;
let commandTimestamp = Date.now();

export interface SetComandoResult {
  comando: string;
  autoReset: boolean;
  duracionMs?: number;
}

/**
 * Obtiene el comando activo actual (ej. 'NADA', 'R-07', 'CINTA_ON')
 */
export function getEstadoArduino(): string {
  return estadoActual;
}

/**
 * Establece un nuevo comando para el Arduino.
 * Aplica lógica de auto-limpieza si corresponde.
 */
export function setComandoArduino(comandoRaw: string): SetComandoResult {
  const comando = (comandoRaw || '').trim().toUpperCase();

  // Cancelar temporizador previo si existía
  if (autoResetTimer) {
    clearTimeout(autoResetTimer);
    autoResetTimer = null;
  }

  estadoActual = comando || 'NADA';
  commandTimestamp = Date.now();

  // Comandos que se quedan fijos sin auto-limpieza
  const isCintaCommand = estadoActual === 'CINTA_ON' || estadoActual === 'CINTA_OFF';
  const isNada = estadoActual === 'NADA';

  // Lógica de auto-limpieza (CRÍTICO):
  // Cualquier comando de camión/ruta (ej. R-01, R-07, C-01, etc.) se auto-limpia a NADA en 2 segundos
  const shouldAutoReset = !isCintaCommand && !isNada;

  if (shouldAutoReset) {
    console.log(`[Arduino Backend] Comando activo: "${estadoActual}". Se restaurará a NADA en 2 segundos.`);
    
    autoResetTimer = setTimeout(() => {
      console.log(`[Arduino Backend] Auto-limpieza ejecutada: Restaurando estado a NADA (estaba en "${estadoActual}").`);
      estadoActual = 'NADA';
      autoResetTimer = null;
      commandTimestamp = Date.now();
    }, 2000);

    return {
      comando: estadoActual,
      autoReset: true,
      duracionMs: 2000,
    };
  }

  console.log(`[Arduino Backend] Comando activo permanente: "${estadoActual}" (sin auto-limpieza).`);
  return {
    comando: estadoActual,
    autoReset: false,
  };
}

let lastEspIp: string | null = null;
let lastEspTimestamp: number = 0;
let lastLoggedEspTime: number = 0;

/**
 * Registra cuando un cliente hace polling a /api/estado_arduino.
 * Distingue estrictamente entre el navegador local (UI) y el ESP8266 físico.
 */
export function recordClientPolling(ip?: string | null, userAgent?: string | null) {
  const rawIp = (ip || '').trim();
  const cleanIp = rawIp.replace(/^.*:/, '') || 'desconocido';
  const ua = (userAgent || '').toLowerCase();

  const isLocalhost = cleanIp === '1' || cleanIp === '127.0.0.1' || cleanIp === 'localhost' || rawIp === '::1';
  const isBrowser = ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox');

  // Solo se considera ESP8266 si viene de una IP externa de la red o su User-Agent es de ESP8266/Arduino
  const isEspDevice = (!isLocalhost && !isBrowser) || ua.includes('esp8266') || (!isBrowser && cleanIp !== '1' && cleanIp !== '127.0.0.1');

  if (isEspDevice) {
    lastEspIp = cleanIp;
    lastEspTimestamp = Date.now();

    const now = Date.now();
    if (now - lastLoggedEspTime > 4000) {
      console.log(`📡 [ESP8266 Físico Conectado] Polling desde ${cleanIp} -> Leyó estado: "${estadoActual}"`);
      lastLoggedEspTime = now;

      // Sincronizar ping con Supabase en segundo plano
      fetch('https://hprhedrdondfunnuhvag.supabase.co/rest/v1/settings?on_conflict=id', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcmhlZHJkb25kZnVubnVodmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTY0ODcsImV4cCI6MjA1ODU3MjQ4N30.65TIp89psr_Cl_MyvUbutsfYRtLI9umPDFiVf1FgQRM',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcmhlZHJkb25kZnVubnVodmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTY0ODcsImV4cCI6MjA1ODU3MjQ4N30.65TIp89psr_Cl_MyvUbutsfYRtLI9umPDFiVf1FgQRM',
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: 'arduino_ping',
          value: JSON.stringify({ ip: cleanIp, timestamp: now }),
          updated_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }
}

/**
 * Información de diagnóstico del estado del Arduino
 */
export function getArduinoDebugInfo() {
  const now = Date.now();
  const isConnected = lastEspTimestamp > 0 && (now - lastEspTimestamp < 4000);

  return {
    estadoActual,
    hasAutoResetTimer: autoResetTimer !== null,
    commandTimestamp,
    elapsedMs: now - commandTimestamp,
    lastClientIp: lastEspIp,
    lastClientTimestamp: lastEspTimestamp,
    isConnected,
    secondsSinceLastPoll: lastEspTimestamp > 0 ? Math.round((now - lastEspTimestamp) / 1000) : null,
  };
}
