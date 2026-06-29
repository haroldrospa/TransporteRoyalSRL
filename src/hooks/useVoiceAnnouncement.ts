import { useState, useCallback, useEffect } from 'react';

export const useVoiceAnnouncement = () => {
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceAnnouncementEnabled');
    return saved === null ? true : saved === 'true';
  });

  const [voiceSpeed, setVoiceSpeed] = useState(() => {
    const saved = localStorage.getItem('voiceAnnouncementSpeed');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    localStorage.setItem('voiceAnnouncementEnabled', voiceEnabled.toString());
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('voiceAnnouncementSpeed', voiceSpeed.toString());
  }, [voiceSpeed]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = voiceSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, voiceSpeed]);

  const announceConduce = useCallback((fechaCarga?: string, relacionNombre?: string) => {
    if (!voiceEnabled || !fechaCarga || !relacionNombre) return;

    const day = fechaCarga.split('/')[0];
    const dayNumber = parseInt(day, 10).toString();
    const relacionNumber = relacionNombre.replace(/[^0-9]/g, '') || relacionNombre;

    speak(`${dayNumber}, ${relacionNumber}`);
  }, [voiceEnabled, speak]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  const updateVoiceSpeed = useCallback((speed: number) => {
    setVoiceSpeed(speed);
  }, []);

  return {
    voiceEnabled,
    voiceSpeed,
    toggleVoice,
    updateVoiceSpeed,
    speak,
    announceConduce
  };
};
