"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAmbientPlayerResult {
  currentSoundUrl: string | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  loadAndPlay: (url: string) => void;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

export function useAmbientPlayer(): UseAmbientPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSoundUrl, setCurrentSoundUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5); // Default volume 0-1
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume); // To store volume before muting

  // Initialize audio element on first render
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleVolumeChange = () => {
        if (audioRef.current) {
          setVolumeState(audioRef.current.volume);
          setIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
        }
      };

      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('volumechange', handleVolumeChange);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('play', handlePlay);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('volumechange', handleVolumeChange);
          audioRef.current.pause();
          audioRef.current.src = ''; // Clear source
          audioRef.current.load(); // Ensure it's unloaded
          audioRef.current = null; // Dereference
        }
      };
    }
  }, []);

  const loadAndPlay = useCallback((url: string) => {
    if (audioRef.current) {
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
        audioRef.current.load(); // Load the new source
        setCurrentSoundUrl(url);
      }
      audioRef.current.play().catch(error => console.error("Error playing ambient sound:", error));
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Error toggling ambient sound play:", error));
      }
    }
  }, [isPlaying]);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolumeState(vol);
      if (vol > 0) {
        setIsMuted(false);
        prevVolumeRef.current = vol;
      } else {
        setIsMuted(true);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.muted = false;
        setVolumeState(prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.5);
      } else {
        prevVolumeRef.current = audioRef.current.volume;
        audioRef.current.muted = true;
        setVolumeState(0);
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return {
    currentSoundUrl,
    isPlaying,
    volume,
    isMuted,
    loadAndPlay,
    togglePlayPause,
    setVolume,
    toggleMute,
  };
}