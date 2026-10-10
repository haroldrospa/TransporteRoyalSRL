import { saveArduinoStateToDb } from './_supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const comandoRaw = body.comando;

    if (typeof comandoRaw !== 'string') {
      return res.status(400).json({ status: 'error', message: 'El campo "comando" es obligatorio.' });
    }

    const comando = comandoRaw.trim().toUpperCase();
    const isCinta = comando === 'CINTA_ON' || comando === 'CINTA_OFF';
    const isNada = comando === 'NADA' || !comando;
    const isRoute = !isCinta && !isNada;

    await saveArduinoStateToDb(comando);

    return res.status(200).json({
      status: 'ok',
      comando,
      autoReset: isRoute,
      duracionMs: isRoute ? 2000 : undefined,
    });
  } catch (err) {
    console.error('Error in comando_arduino handler:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Error interno' });
  }
}
