// Standalone HTTP server for Arduino ESP8266 integration
const http = require('http');

let estadoActual = 'NADA';
let autoResetTimer = null;
let commandTimestamp = Date.now();

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
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.end(estadoActual);
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
