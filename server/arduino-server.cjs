// Standalone HTTP server for Arduino ESP8266 integration
const http = require('http');

let estadoActual = 'NADA';
let autoResetTimer = null;
let commandTimestamp = Date.now();
let lastEspIp = null;
let lastEspTimestamp = 0;
let lastLoggedEspTime = 0;

const HTTP_PORT = process.env.ARDUINO_PORT || 5000;

function setComando(comandoRaw) {
  const comando = (comandoRaw || '').trim().toUpperCase();

  if (autoResetTimer) {
    clearTimeout(autoResetTimer);
    autoResetTimer = null;
  }

  estadoActual = comando || 'NADA';
  commandTimestamp = Date.now();

  const isCinta = estadoActual === 'CINTA_ON' || estadoActual === 'CINTA_OFF';
  const isNada = estadoActual === 'NADA';
  const shouldAutoReset = !isCinta && !isNada;

  if (shouldAutoReset) {
    console.log(`[Arduino Server] Comando '${estadoActual}' recibido. Programada auto-limpieza en 2 segundos.`);
    autoResetTimer = setTimeout(() => {
      console.log(`[Arduino Server] Auto-limpieza ejecutada: Restaurando estado a NADA.`);
      estadoActual = 'NADA';
      autoResetTimer = null;
      commandTimestamp = Date.now();
    }, 2000);

    return { comando: estadoActual, autoReset: true, duracionMs: 2000 };
  }

  console.log(`[Arduino Server] Comando fijo '${estadoActual}' establecido.`);
  return { comando: estadoActual, autoReset: false };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  if (url === '/api/estado_arduino' && req.method === 'GET') {
    const rawIp = req.socket?.remoteAddress || '';
    const cleanIp = rawIp.replace(/^.*:/, '') || 'esp8266';
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isBrowser = ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox');
    const isEsp = ua.includes('esp8266') || ua.includes('arduino') || !isBrowser;

    if (isEsp) {
      lastEspIp = cleanIp;
      lastEspTimestamp = Date.now();

      // Sincronizar con Supabase cada 4 segundos
      const now = Date.now();
      if (now - lastLoggedEspTime > 4000) {
        lastLoggedEspTime = now;
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

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.end(estadoActual);
    return;
  }

  if (url === '/api/arduino_debug' && req.method === 'GET') {
    const now = Date.now();
    const isConnected = lastEspTimestamp > 0 && (now - lastEspTimestamp < 4000);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.end(JSON.stringify({
      estadoActual,
      hasAutoResetTimer: autoResetTimer !== null,
      commandTimestamp,
      elapsedMs: now - commandTimestamp,
      lastClientIp: lastEspIp,
      lastClientTimestamp: lastEspTimestamp,
      isConnected,
      secondsSinceLastPoll: lastEspTimestamp > 0 ? Math.round((now - lastEspTimestamp) / 1000) : null,
    }));
    return;
  }

  if (url === '/api/comando_arduino' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const comando = data.comando;
        if (typeof comando !== 'string') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'error', message: 'El campo "comando" es obligatorio.' }));
          return;
        }

        const result = setComando(comando);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', comando: result.comando, autoReset: result.autoReset }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'error', message: 'JSON inválido' }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('404 Not Found');
});

server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`📡 [Arduino Standalone Server] Escuchando en http://0.0.0.0:${HTTP_PORT}`);
  console.log(`   GET  http://localhost:${HTTP_PORT}/api/estado_arduino`);
  console.log(`   POST http://localhost:${HTTP_PORT}/api/comando_arduino`);
});
