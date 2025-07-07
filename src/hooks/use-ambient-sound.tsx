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
    // isReadyToPlay is not directly exposed by useHtmlAudioPlayer,
    // but the buffering state is what we care about.
    // The `isBuffering` state will be derived from `isReadyToPlay` and `audioIsPlaying`
    // or directly from `waiting` event.
  } = useHtmlAudioPlayer(soundUrl);

  const [isBuffering, setIsBuffering] = useState(false);

  // Ensure the audio element loops and listen for buffering events
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;

      const handleWaiting = () => {
        console.log(`[useAmbientSound] Waiting for: ${soundUrl}`);
        setIsBuffering(true);
      };
      const handlePlaying = () => {
        console.log(`[useAmbientSound] Playing: ${soundUrl}`);
        setIsBuffering(false);
      };
      const handleCanPlayThrough = () => {
        console.log(`[useAmbientSound] CanPlayThrough: ${soundUrl}`);
        setIsBuffering(false);
      };

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
  }, [audioRef, soundUrl]); // Add soundUrl to dependencies to re-attach listeners if URL changes

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