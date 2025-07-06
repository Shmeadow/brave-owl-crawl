"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner'; // Import toast

interface UseHtmlAudioPlayerResult {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioIsPlaying: boolean;
  audioVolume: number;
  audioIsMuted: boolean;
  audioCurrentTime: number;
  audioDuration: number;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
}

export function useHtmlAudioPlayer(src: string | null): UseHtmlAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioVolume, setAudioVolumeState] = useState(0.7); // Default volume 0-1
  const [audioIsMuted, setAudioIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const prevAudioVolumeRef = useRef(audioVolume); // To store volume before muting

  // Sync play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (audioIsPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          toast.error(`Failed to play audio: ${error.message || 'Unknown error'}. Please check the URL or browser autoplay settings.`);
          setAudioIsPlaying(false); // Stop trying to play
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioIsPlaying]);

  // Sync volume/mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioIsMuted ? 0 : audioVolume;
    }
  }, [audioVolume, audioIsMuted]);

  // Reset audio state when source changes
  useEffect(() => {
    if (audioRef.current) {
      setAudioIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      audioRef.current.load(); // Reload media when src changes
    }
  }, [src]);

  const togglePlayPause = useCallback(() => {
    setAudioIsPlaying(prev => !prev);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setAudioVolumeState(vol);
    if (vol > 0) {
      setAudioIsMuted(false);
      prevAudioVolumeRef.current = vol;
    } else {
      setAudioIsMuted(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioIsMuted) {
      setVolume(prevAudioVolumeRef.current > 0 ? prevAudioVolumeRef.current : 0.7);
    } else {
      prevAudioVolumeRef.current = audioVolume;
      setVolume(0);
    }
  }, [audioIsMuted, audioVolume, setVolume]);

  const seekTo = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setAudioCurrentTime(seconds);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioDuration);
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  }, [audioDuration]);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onEnded = useCallback(() => {
    setAudioIsPlaying(false);
    setAudioCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  return {
    audioRef,
    audioIsPlaying,
    audioVolume,
    audioIsMuted,
    audioCurrentTime,
    audioDuration,
    togglePlayPause,
    setVolume,
    toggleMute,
    seekTo,
    skipForward,
    skipBackward,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
  };
}