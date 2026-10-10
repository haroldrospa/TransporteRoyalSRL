import { getArduinoStateFromDb, getEspPing } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  try {
    const [{ comando, updated_at }, ping] = await Promise.all([
      getArduinoStateFromDb(),
      getEspPing(),
    ]);

    const now = Date.now();
    const elapsedMs = updated_at > 0 ? now - updated_at : 0;
    const isCinta = comando === 'CINTA_ON' || comando === 'CINTA_OFF';
    const isNada = comando === 'NADA' || !comando;
    const isAutoResetActive = !isCinta && !isNada && elapsedMs <= 2000;
    const estadoEfectivo = isAutoResetActive || isCinta ? comando : 'NADA';

    const isConnected = ping.timestamp > 0 && (now - ping.timestamp < 6000);
    const secondsSinceLastPoll = ping.timestamp > 0 ? Math.round((now - ping.timestamp) / 1000) : null;

    return res.status(200).json({
      estadoActual: estadoEfectivo,
      rawComando: comando,
      commandTimestamp: updated_at,
      elapsedMs,
      hasAutoResetTimer: isAutoResetActive,
      serverTime: now,
      isConnected,
      lastClientIp: ping.ip,
      lastClientTimestamp: ping.timestamp,
      secondsSinceLastPoll,
      environment: 'vercel-serverless',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
