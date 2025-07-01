"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

const LOCAL_STORAGE_AUDIO_PLAYING_KEY = 'lofi_audio_playing';

export function useLofiAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedPlayingState = localStorage.getItem(LOCAL_STORAGE_AUDIO_PLAYING_KEY);
      if (savedPlayingState === 'true' && audioRef.current) {
        // Attempt to play, but handle autoplay policy
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.warn("Autoplay prevented:", error);
          // Autoplay failed, keep isPlaying false
          setIsPlaying(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_AUDIO_PLAYING_KEY, String(isPlaying));
    }
  }, [isPlaying, mounted]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        toast.info("Lofi audio paused.");
      } else {
        audioRef.current.play().then(() => {
          toast.success("Lofi audio playing!");
        }).catch(error => {
          toast.error("Failed to play audio. Browser autoplay policy might be blocking it.");
          console.error("Audio play error:", error);
          setIsPlaying(false); // Ensure state is correct if play fails
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  return {
    audioRef,
    isPlaying,
    togglePlayPause,
  };
}