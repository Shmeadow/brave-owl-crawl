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
    togglePlayPause,
    setVolume,
    toggleMute,
    onLoadedMetadata, // Not directly used for controls, but good to have
    onTimeUpdate,     // Not directly used for controls, but good to have
    onEnded,          // Not directly used for controls, but good to have
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
    togglePlayPause,
    setVolume,
    toggleMute,
  };
}