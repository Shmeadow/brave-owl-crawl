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
        console.log(`[useHtmlAudioPlayer] Attempting to play audio: ${src}`);
        audioRef.current.play().catch(error => {
          console.error("[useHtmlAudioPlayer] Error playing audio:", error);
          toast.error(`Failed to play audio: ${error.message || 'Unknown error'}. Please check the URL or browser autoplay settings.`);
          setAudioIsPlaying(false); // Stop trying to play
        });
      } else {
        console.log(`[useHtmlAudioPlayer] Attempting to pause audio: ${src}`);
        audioRef.current.pause();
      }
    }
  }, [audioIsPlaying, src]);

  // Sync volume/mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioIsMuted ? 0 : audioVolume;
      console.log(`[useHtmlAudioPlayer] Volume set to: ${audioRef.current.volume}, Muted: ${audioRef.current.muted}`);
    }
  }, [audioVolume, audioIsMuted]);

  // Reset audio state when source changes
  useEffect(() => {
    if (audioRef.current) {
      console.log(`[useHtmlAudioPlayer] Source changed to: ${src}. Resetting audio state.`);
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
      console.log(`[useHtmlAudioPlayer] Seeked to: ${seconds}s`);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioDuration);
      setAudioCurrentTime(audioRef.current.currentTime);
      console.log(`[useHtmlAudioPlayer] Skipped forward to: ${audioRef.current.currentTime}s`);
    }
  }, [audioDuration]);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      setAudioCurrentTime(audioRef.current.currentTime);
      console.log(`[useHtmlAudioPlayer] Skipped backward to: ${audioRef.current.currentTime}s`);
    }
  }, []);

  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      console.log(`[useHtmlAudioPlayer] Metadata loaded. Duration: ${audioRef.current.duration}s`);
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
    console.log("[useHtmlAudioPlayer] Audio ended.");
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