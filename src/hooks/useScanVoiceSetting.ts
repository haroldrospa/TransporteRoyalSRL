import { useEffect, useState } from 'react';

const KEY_ENABLED = 'cargarCamionesVoiceEnabled';
const KEY_RATE = 'cargarCamionesVoiceRate';
const KEY_PITCH = 'cargarCamionesVoicePitch';

const readEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(KEY_ENABLED);
  return v === null ? true : v === 'true';
};
const readRate = (): number => {
  if (typeof window === 'undefined') return 1;
  const v = parseFloat(localStorage.getItem(KEY_RATE) || '1');
  return isNaN(v) ? 1 : v;
};
const readPitch = (): number => {
  if (typeof window === 'undefined') return 1;
  const v = parseFloat(localStorage.getItem(KEY_PITCH) || '1');
  return isNaN(v) ? 1 : v;
};

export const getScanVoiceSettings = () => ({
  enabled: readEnabled(),
  rate: readRate(),
  pitch: readPitch(),
});

export const useScanVoiceSetting = () => {
  const [enabled, setEnabled] = useState<boolean>(readEnabled);
  const [rate, setRate] = useState<number>(readRate);
  const [pitch, setPitch] = useState<number>(readPitch);

  useEffect(() => {
    localStorage.setItem(KEY_ENABLED, String(enabled));
    window.dispatchEvent(new CustomEvent('scan-voice-setting-changed', { detail: { enabled } }));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem(KEY_RATE, String(rate));
  }, [rate]);

  useEffect(() => {
    localStorage.setItem(KEY_PITCH, String(pitch));
  }, [pitch]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.enabled === 'boolean') setEnabled(detail.enabled);
    };
    window.addEventListener('scan-voice-setting-changed', handler);
    return () => window.removeEventListener('scan-voice-setting-changed', handler);
  }, []);

  return {
    enabled,
    setEnabled,
    toggle: () => setEnabled(p => !p),
    rate,
    setRate,
    pitch,
    setPitch,
  };
};
