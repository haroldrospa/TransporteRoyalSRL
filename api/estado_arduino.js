import { getArduinoStateFromDb, recordEspPing } from './_supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Registrar presencia de ESP8266 si el cliente no es un navegador
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  recordEspPing(ip, userAgent).catch(() => {});

  try {
    const { comando, updated_at } = await getArduinoStateFromDb();
    
    // Reglas de negocio:
    // Comandos de cinta ('CINTA_ON', 'CINTA_OFF') son fijos.
    // 'NADA' es reposo.
    // Rutas ('R-01', 'R-07', etc.) duran 2 segundos y se auto-limpian a 'NADA'.
    const isCinta = comando === 'CINTA_ON' || comando === 'CINTA_OFF';
    const isNada = comando === 'NADA' || !comando;

    if (!isCinta && !isNada) {
      const elapsed = Date.now() - updated_at;
      if (elapsed > 2000) {
        return res.status(200).send('NADA');
      }
    }

    return res.status(200).send(comando || 'NADA');
  } catch (err) {
    console.error('Error in estado_arduino handler:', err);
    return res.status(200).send('NADA');
  }
}
