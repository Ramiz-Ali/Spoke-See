import { useEffect, useRef } from 'react';
import useAppStore from '../store';

const MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3';

const useBackgroundMusic = () => {
  const { audioState, isListening } = useAppStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const hasInteractedRef = useRef<boolean>(false);

  const fadeVolume = (start: number, end: number, duration: number = 1000) => {
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
    }
    
    if (!audioRef.current) return;

    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = (end - start) / steps;
    let currentStep = 0;

    audioRef.current.volume = start;

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          window.clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        if (audioRef.current) {
          audioRef.current.volume = end;
          if (end === 0) {
            audioRef.current.pause();
          }
        }
        return;
      }

      if (audioRef.current) {
        audioRef.current.volume = start + (volumeStep * currentStep);
      }
    }, stepTime);
  };

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
      
      // Listen for user interaction
      const handleInteraction = () => {
        hasInteractedRef.current = true;
        document.removeEventListener('click', handleInteraction);
      };
      document.addEventListener('click', handleInteraction);
    }

    return () => {
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const { isMusicEnabled, volume } = audioState;

    if (isMusicEnabled && !isListening && hasInteractedRef.current) {
      audio.volume = 0;
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
      fadeVolume(0, volume);
    } else {
      fadeVolume(audio.volume, 0);
    }
  }, [audioState.isMusicEnabled, isListening, hasInteractedRef.current]);

  useEffect(() => {
    if (!audioRef.current || !audioState.isMusicEnabled) return;
    audioRef.current.volume = audioState.volume;
  }, [audioState.volume]);

  return {
    isPlaying: audioRef.current?.paused === false,
    error: audioRef.current?.error
  };
};

export default useBackgroundMusic;