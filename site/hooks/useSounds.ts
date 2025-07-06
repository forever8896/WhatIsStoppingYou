import { useCallback, useRef, useState } from 'react';

type SoundType = 'pledge' | 'success' | 'coin';

interface SoundMap {
  pledge: string;
  success: string;
  coin: string;
}

const SOUND_FILES: SoundMap = {
  pledge: '/sounds/sonic-coin.mp3',
  success: '/sounds/ka-ching.mp3',
  coin: '/sounds/money-cink.mp3'
};

export const useSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Preload sounds
  const preloadSounds = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    const loadPromises: Promise<void>[] = [];

    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = 0.6; // Set default volume
      
      const loadPromise = new Promise<void>((resolve) => {
        const handleLoad = () => {
          audioRefs.current.set(key as SoundType, audio);
          resolve();
        };
        
        const handleError = () => {
          console.warn(`Failed to load sound: ${src}`);
          resolve(); // Resolve anyway to not block other sounds
        };

        audio.addEventListener('canplaythrough', handleLoad, { once: true });
        audio.addEventListener('error', handleError, { once: true });
      });

      loadPromises.push(loadPromise);
    });

    Promise.all(loadPromises).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Play sound function
  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled || typeof window === 'undefined') return;

    const audio = audioRefs.current.get(type);
    if (!audio) {
      console.warn(`Sound ${type} not loaded`);
      return;
    }

    try {
      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Play the sound
      const playPromise = audio.play();
      
      // Handle play promise (required for some browsers)
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`Failed to play sound ${type}:`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound ${type}:`, error);
    }
  }, [soundEnabled]);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Set volume for all sounds
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRefs.current.forEach((audio) => {
      audio.volume = clampedVolume;
    });
  }, []);

  return {
    soundEnabled,
    isLoading,
    playSound,
    toggleSound,
    setVolume,
    preloadSounds
  };
}; 