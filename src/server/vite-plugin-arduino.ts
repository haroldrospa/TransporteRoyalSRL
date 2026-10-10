import type { Plugin, ViteDevServer } from 'vite';
import http from 'http';
import { getEstadoArduino, setComandoArduino, getArduinoDebugInfo, recordClientPolling } from './arduino-state';

export interface ArduinoPluginOptions {
  httpPort?: number;
}

export function arduinoApiPlugin(options: ArduinoPluginOptions = {}): Plugin {
  let plainHttpServer: http.Server | null = null;
  const preferredPort = options.httpPort || 5000;

  const handleRequest = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: () => void
  ) => {
    // CORS headers para permitir peticiones desde cualquier origen (ESP8266, navegador, apps)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const rawUrl = req.url || '';
    const pathname = rawUrl.split('?')[0];

    // Endpoint 1: GET /api/estado_arduino -> Devuelve text/plain con el comando activo
    if (pathname === '/api/estado_arduino' && req.method === 'GET') {
      const clientIp = req.socket?.remoteAddress;
      const userAgent = (req.headers['user-agent'] as string) || '';
      recordClientPolling(clientIp, userAgent);

      const estado = getEstadoArduino();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.end(estado);
      return;
    }

    // Endpoint 2: POST /api/comando_arduino -> Recibe JSON { "comando": "VALOR" }
    if (pathname === '/api/comando_arduino' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const comando = parsed.comando;

          if (typeof comando !== 'string') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                status: 'error',
                message: 'El campo "comando" es obligatorio y debe ser texto.',
              })
            );
            return;
          }

          const result = setComandoArduino(comando);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              comando: result.comando,
              autoReset: result.autoReset,
              duracionMs: result.duracionMs,
            })
          );
        } catch (err: any) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'error',
              message: 'Cuerpo de petición JSON inválido.',
              details: err?.message,
            })
          );
        }
      });
      return;
    }

    // Endpoint 3: GET /api/arduino_debug -> Información de diagnóstico para UI/Dev
    if (pathname === '/api/arduino_debug' && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store');
      res.end(JSON.stringify(getArduinoDebugInfo()));
      return;
    }

    if (next) {
      next();
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found');
    }
  };

  return {
    name: 'vite-plugin-arduino-api',
    configureServer(server: ViteDevServer) {
      // 1. Integrar rutas en el servidor de desarrollo de Vite (HTTPS)
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];

        if (
          pathname === '/api/estado_arduino' ||
          pathname === '/api/comando_arduino' ||
          pathname === '/api/arduino_debug'
        ) {
          handleRequest(req, res, next);
        } else {
          next();
        }
      });

      // 2. Levantar servidor HTTP plano en segundo plano (para ESP8266 sin SSL)
      if (!plainHttpServer) {
        const startHttpListener = (port: number) => {
          const srv = http.createServer((req, res) => {
            handleRequest(req, res);
          });

          srv.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              console.warn(
                `[Arduino API] Puerto ${port} ocupado. Probando en puerto ${port + 1}...`
              );
              startHttpListener(port + 1);
            } else {
              console.error('[Arduino API] Error en servidor HTTP:', err);
            }
          });

          srv.listen(port, '0.0.0.0', () => {
            plainHttpServer = srv;
            console.log(
              `\n📡 [Arduino ESP8266] API HTTP (Plano, sin SSL) activa en: http://0.0.0.0:${port}/api/estado_arduino`
            );
            console.log(
              `📡 [Arduino ESP8266] API HTTPS integrada en Vite en: /api/estado_arduino\n`
            );
          });
        };

        startHttpListener(preferredPort);
      }
    },
    closeBundle() {
      if (plainHttpServer) {
        plainHttpServer.close();
        plainHttpServer = null;
      }
    },
  };
}
