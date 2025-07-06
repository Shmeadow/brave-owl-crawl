"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHtmlAudioPlayer } from './use-html-audio-player';

interface UseAmbientSoundResult {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean; // New state
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

export function useAmbientSound(soundUrl: string): UseAmbientSoundResult {
  const {
    audioRef,
    audioIsPlaying,
    audioVolume,
    audioIsMuted,
    togglePlayPause: htmlAudioTogglePlayPause,
    setVolume,
    toggleMute,
  } = useHtmlAudioPlayer(soundUrl);

  const [isBuffering, setIsBuffering] = useState(false);

  // Ensure the audio element loops
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;

      const handleWaiting = () => setIsBuffering(true);
      const handlePlaying = () => setIsBuffering(false);
      const handleCanPlayThrough = () => setIsBuffering(false);

      audioRef.current.addEventListener('waiting', handleWaiting);
      audioRef.current.addEventListener('playing', handlePlaying);
      audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('waiting', handleWaiting);
          audioRef.current.removeEventListener('playing', handlePlaying);
          audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        }
      };
    }
  }, [audioRef]);

  return {
    isPlaying: audioIsPlaying,
    volume: audioVolume,
    isMuted: audioIsMuted,
    isBuffering, // Expose new state
    togglePlayPause: htmlAudioTogglePlayPause,
    setVolume,
    toggleMute,
  };
}