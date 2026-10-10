/**
 * Servicio de integración con el sistema físico Arduino (ESP8266)
 * para Transporte Royal.
 *
 * Controla:
 * - Envío de comandos manuales y automáticos (/api/comando_arduino)
 * - Consulta de estado activo (/api/estado_arduino)
 */

export interface ComandoArduinoResponse {
  status: 'ok' | 'error';
  comando: string;
  autoReset?: boolean;
  duracionMs?: number;
  message?: string;
}

export interface ArduinoDebugInfo {
  estadoActual: string;
  hasAutoResetTimer: boolean;
  commandTimestamp: number;
  elapsedMs: number;
}

/**
 * Envía un comando al backend para que el ESP8266 lo lea.
 * Si es una ruta (ej: "R-01", "R-07"), el backend mantendrá el estado por 2s
 * y luego se auto-limpiará a "NADA".
 * Si es "CINTA_ON" o "CINTA_OFF", se mantendrá de forma fija.
 *
 * @param comando Código de la ruta ("R-07") o acción ("CINTA_ON", "CINTA_OFF", "NADA")
 */
export async function enviarComandoArduino(comando: string): Promise<boolean> {
  if (!comando) return false;

  const comandoLimpio = comando.trim().toUpperCase();

  try {
    console.log(`📡 [Arduino Service] POST /api/comando_arduino -> "${comandoLimpio}"`);

    const response = await fetch('/api/comando_arduino', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comando: comandoLimpio }),
    });

    if (!response.ok) {
      console.warn(`⚠️ [Arduino Service] Error en respuesta: ${response.status} ${response.statusText}`);
      return false;
    }

    const data: ComandoArduinoResponse = await response.json();
    console.log(`✅ [Arduino Service] Comando registrado en backend: "${data.comando}" (autoReset: ${data.autoReset})`);
    
    // Emitir un evento en la ventana para que cualquier componente de la UI se entere inmediatamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('arduino-command-sent', {
          detail: {
            comando: data.comando,
            autoReset: data.autoReset,
            duracionMs: data.duracionMs || 2000,
            timestamp: Date.now(),
          },
        })
      );
    }

    return true;
  } catch (error) {
    console.error('❌ [Arduino Service] Error al conectar con el backend:', error);
    return false;
  }
}

/**
 * Consulta el estado actual activo que está leyendo el Arduino.
 * Retorna texto plano (ej: 'NADA', 'R-07', 'CINTA_ON')
 */
export async function obtenerEstadoArduino(): Promise<string> {
  try {
    const response = await fetch('/api/estado_arduino', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return 'NADA';
    }

    const text = await response.text();
    return text.trim() || 'NADA';
  } catch (error) {
    console.warn('⚠️ [Arduino Service] Fallo al consultar estado de Arduino:', error);
    return 'NADA';
  }
}

/**
 * Consulta información de depuración del estado del Arduino
 */
export async function obtenerArduinoDebug(): Promise<ArduinoDebugInfo | null> {
  try {
    const response = await fetch('/api/arduino_debug', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
