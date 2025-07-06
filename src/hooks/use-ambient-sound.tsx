"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHtmlAudioPlayer } from './use-html-audio-player';

interface UseAmbientSoundResult {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
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

  // Ensure the audio element loops
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
    }
  }, [audioRef]);

  return {
    isPlaying: audioIsPlaying,
    volume: audioVolume,
    isMuted: audioIsMuted,
    togglePlayPause: htmlAudioTogglePlayPause, // Expose the underlying toggle
    setVolume,
    toggleMute,
  };
}