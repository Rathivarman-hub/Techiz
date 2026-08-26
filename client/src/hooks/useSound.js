import { useRef, useCallback } from 'react';

export const useSound = () => {
  const enabled = useRef(localStorage.getItem('techiz-sound') !== 'off');
  const audioCtx = useRef(null);

  const getCtx = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  };

  const playTone = useCallback((freq, type = 'sine', duration = 0.15, volume = 0.2) => {
    if (!enabled.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  // Subtle tick
  const playTick = useCallback(() => playTone(880, 'sine', 0.05, 0.08), [playTone]);

  // Urgent countdown tones (Tum Tum Ta-Dow)
  const playUrgent = useCallback((secondsLeft) => {
    if (!enabled.current) return;
    if (secondsLeft === 3) { playTone(440, 'square', 0.25, 0.25); }
    else if (secondsLeft === 2) { playTone(440, 'square', 0.25, 0.25); }
    else if (secondsLeft === 1) {
      setTimeout(() => playTone(350, 'sawtooth', 0.1, 0.3), 0);
      setTimeout(() => playTone(500, 'sawtooth', 0.15, 0.3), 100);
      setTimeout(() => playTone(700, 'square', 0.4, 0.5), 250);
    }
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523, 'sine', 0.2, 0.3);
    setTimeout(() => playTone(659, 'sine', 0.2, 0.3), 200);
    setTimeout(() => playTone(784, 'sine', 0.3, 0.5), 400);
  }, [playTone]);

  const playError = useCallback(() => playTone(220, 'sawtooth', 0.4, 0.4), [playTone]);

  const toggleSound = useCallback(() => {
    enabled.current = !enabled.current;
    localStorage.setItem('techiz-sound', enabled.current ? 'on' : 'off');
    return enabled.current;
  }, []);

  const isSoundEnabled = () => enabled.current;

  return { playTick, playUrgent, playSuccess, playError, toggleSound, isSoundEnabled };
};
