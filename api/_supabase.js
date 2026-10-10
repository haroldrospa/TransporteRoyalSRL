import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hprhedrdondfunnuhvag.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcmhlZHJkb25kZnVubnVodmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTY0ODcsImV4cCI6MjA1ODU3MjQ4N30.65TIp89psr_Cl_MyvUbutsfYRtLI9umPDFiVf1FgQRM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export async function getArduinoStateFromDb() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'arduino_state')
      .maybeSingle();

    if (error || !data?.value) {
      return { comando: 'NADA', updated_at: 0 };
    }

    try {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return {
        comando: (parsed.comando || 'NADA').toUpperCase().trim(),
        updated_at: Number(parsed.updated_at) || 0,
      };
    } catch {
      return {
        comando: String(data.value).toUpperCase().trim() || 'NADA',
        updated_at: 0,
      };
    }
  } catch (err) {
    console.error('Error reading arduino state:', err);
    return { comando: 'NADA', updated_at: 0 };
  }
}

export async function saveArduinoStateToDb(comando) {
  const cleanCmd = (comando || 'NADA').toUpperCase().trim();
  const payload = {
    comando: cleanCmd,
    updated_at: Date.now(),
  };

  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        id: 'arduino_state',
        value: JSON.stringify(payload),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving arduino state:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving arduino state:', err);
    return false;
  }
}

let lastPingWriteTime = 0;

export async function recordEspPing(ip, userAgent) {
  const ua = (userAgent || '').toLowerCase();
  const isBrowser = ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox');
  const isEsp = ua.includes('esp8266') || ua.includes('arduino') || !isBrowser;

  if (!isEsp) return;

  const now = Date.now();
  // Throttling para no saturar Supabase (máximo una escritura cada 3.5 segundos)
  if (now - lastPingWriteTime < 3500) return;
  lastPingWriteTime = now;

  const rawIp = (ip || '').split(',')[0].trim();
  const cleanIp = rawIp.replace(/^.*:/, '') || 'esp8266';

  try {
    await supabase.from('settings').upsert({
      id: 'arduino_ping',
      value: JSON.stringify({ ip: cleanIp, timestamp: now }),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error recording ESP ping:', err);
  }
}

export async function getEspPing() {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'arduino_ping')
      .maybeSingle();

    if (!data?.value) return { ip: null, timestamp: 0 };
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return {
      ip: parsed.ip || null,
      timestamp: Number(parsed.timestamp) || 0,
    };
  } catch (err) {
    return { ip: null, timestamp: 0 };
  }
}
