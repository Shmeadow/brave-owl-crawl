"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

interface UseHtmlAudioPlayerResult {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  isReady: boolean; // New: indicate if audio is ready to play
}

export default function useClientAudio(src: string): UseHtmlAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false); // New state
  const prevVolumeRef = useRef(volume);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Renamed for clarity

  // 1. Initialize audio element and attach core event listeners once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;

      const audio = audioRef.current;

      const onError = (e: Event) => {
        console.error(`[useClientAudio] load error for ${audio.src}:`, e);
        toast.error(`Failed to load audio: ${audio.src.split('/').pop()}. Please ensure the file exists and is accessible.`);
        setIsPlaying(false);
        setIsReady(false); // Not ready on error
      };
      const onCanPlayThrough = () => { // New listener for readiness
        setIsReady(true);
      };
      const onVolumeChange = () => {
        if (audioRef.current) {
          setVolumeState(audioRef.current.volume);
          setIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
        }
      };

      audio.addEventListener("error", onError);
      audio.addEventListener("canplaythrough", onCanPlayThrough); // Listen for readiness
      audio.addEventListener("volumechange", onVolumeChange);

      return () => {
        audio.pause();
        audio.removeEventListener("error", onError);
        audio.removeEventListener("canplaythrough", onCanPlayThrough);
        audio.removeEventListener("volumechange", onVolumeChange);
        // Clear polling interval on unmount
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, []); // Empty dependency array: runs only once on mount

  // 2. Sync `src` prop with audio element and manage polling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear any existing polling interval when src changes
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (src && audio.src !== src) {
      audio.src = src;
      audio.load(); // Load the new source
      setIsPlaying(false); // Reset playing state when source changes
      setIsReady(false); // Reset ready state when source changes
    } else if (!src && audio.src) {
      audio.src = '';
      audio.load();
      setIsPlaying(false);
      setIsReady(false);
    }

    // Start polling for isPlaying state
    pollingIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setIsPlaying(!audioRef.current.paused);
      }
    }, 100); // Poll every 100ms for responsiveness

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [src]); // Dependency on src: runs when src prop changes

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isReady) { // Only play if audio is ready
      console.warn("[useClientAudio] Audio not ready to play.");
      if (!isReady) toast.info("Audio is still loading or failed to load.");
      return;
    }
    try {
      await audio.play();
    } catch (err: any) {
      console.error(`[useClientAudio] play error for ${audio.src}:`, err);
      if (err.name === "NotAllowedError") {
        toast.error("Autoplay blocked by browser. Please interact with the page to play audio.");
      } else {
        toast.error(`Failed to play audio: ${err.message || 'Unknown error'}.`);
      }
      setIsPlaying(false); // Ensure state is correct if play fails
    }
  }, [isReady]); // Depend on isReady

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
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
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.muted = false;
        setVolumeState(prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.5);
      } else {
        prevVolumeRef.current = audio.volume;
        audio.muted = true;
        setVolumeState(0);
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return { audioRef, isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute, isReady };
}