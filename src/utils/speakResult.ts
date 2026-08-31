import { getScanVoiceSettings } from '@/hooks/useScanVoiceSetting';

function formatTruckName(encomendado: string): string {
  if (!encomendado) return '';
  const clean = encomendado.trim();
  
  // Format "R-01", "R-02", "R01" as "R 1", "R 2", etc.
  const rMatch = clean.match(/^([a-zA-Z]+)-?0*([0-9]+)$/);
  if (rMatch) {
    return `${rMatch[1]} ${rMatch[2]}`;
  }
  return clean;
}

export const speakResult = (options: {
  encomendado?: string;
  duplicate?: boolean;
  notFound?: boolean;
  delivered?: boolean;
  unassigned?: boolean;
  customMessage?: string;
}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const settings = getScanVoiceSettings();
  if (!settings.enabled) return;

  let textToSpeak = '';

  if (options.notFound) {
    textToSpeak = 'No encontrado';
  } else if (options.delivered) {
    textToSpeak = 'Conduce entregado';
  } else if (options.unassigned) {
    textToSpeak = 'Sin asignar';
  } else if (options.duplicate) {
    const truck = options.encomendado ? formatTruckName(options.encomendado) : '';
    textToSpeak = truck ? `Ya escaneado, ${truck}` : 'Ya escaneado';
  } else if (options.encomendado) {
    textToSpeak = formatTruckName(options.encomendado);
  } else if (options.customMessage) {
    textToSpeak = options.customMessage;
  }

  if (!textToSpeak) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = settings.rate || 1.15;
    utterance.pitch = settings.pitch || 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase().includes('es-')
    );
    if (esVoice) {
      utterance.voice = esVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
};
