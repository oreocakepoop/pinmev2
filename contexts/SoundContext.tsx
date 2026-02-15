import React, { createContext, useContext, useRef, useCallback } from 'react';

interface SoundContextType {
  playClick: () => void;
  playHover: () => void;
  playSuccess: () => void;
  playError: () => void;
  playType: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      playClick: () => {},
      playHover: () => {},
      playSuccess: () => {},
      playError: () => {},
      playType: () => {},
    };
  }
  return context;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
    initAudio();
    if (!audioCtxRef.current) return;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration);
  }, []);

  // Mechanical Switch Sound
  const playClick = useCallback(() => {
    playTone(800, 'square', 0.05, 0.05);
    setTimeout(() => playTone(400, 'triangle', 0.05, 0.05), 50);
  }, [playTone]);

  // High Pitch Data Hover
  const playHover = useCallback(() => {
    playTone(1200, 'sine', 0.03, 0.01);
  }, [playTone]);

  // Success Chime (Major Triad Arpeggio)
  const playSuccess = useCallback(() => {
    playTone(440, 'sine', 0.2, 0.1); // A4
    setTimeout(() => playTone(554, 'sine', 0.2, 0.1), 100); // C#5
    setTimeout(() => playTone(659, 'sine', 0.4, 0.1), 200); // E5
  }, [playTone]);

  // Error Buzz
  const playError = useCallback(() => {
    playTone(150, 'sawtooth', 0.3, 0.1);
    setTimeout(() => playTone(140, 'sawtooth', 0.3, 0.1), 100);
  }, [playTone]);

  // Typing Click
  const playType = useCallback(() => {
    playTone(2000, 'square', 0.01, 0.02);
  }, [playTone]);

  return (
    <SoundContext.Provider value={{ playClick, playHover, playSuccess, playError, playType }}>
      {children}
    </SoundContext.Provider>
  );
};