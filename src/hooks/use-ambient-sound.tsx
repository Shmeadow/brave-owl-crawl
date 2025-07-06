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
    audioIsPlaying, // This is the state from useHtmlAudioPlayer
    audioVolume,
    audioIsMuted,
    togglePlayPause: htmlAudioTogglePlayPause, // Rename to avoid conflict
    setVolume,
    toggleMute,
  } = useHtmlAudioPlayer(soundUrl);

  // State to control if this specific ambient sound should be playing
  const [shouldPlay, setShouldPlay] = useState(true); // Default to true for autoplay

  // Effect to ensure the audio element loops
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
    }
  }, [audioRef]);

  // Effect to control playback based on shouldPlay state
  useEffect(() => {
    if (shouldPlay && !audioIsPlaying) {
      htmlAudioTogglePlayPause(); // Start playing if it should and isn't
    } else if (!shouldPlay && audioIsPlaying) {
      htmlAudioTogglePlayPause(); // Pause if it shouldn't and is playing
    }
  }, [shouldPlay, audioIsPlaying, htmlAudioTogglePlayPause]);

  const togglePlayPause = useCallback(() => {
    setShouldPlay(prev => !prev);
  }, []);

  return {
    isPlaying: shouldPlay, // Expose our controlled state
    volume: audioVolume,
    isMuted: audioIsMuted,
    togglePlayPause,
    setVolume,
    toggleMute,
  };
}