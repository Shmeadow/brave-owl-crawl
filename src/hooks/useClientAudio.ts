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
}

export default function useClientAudio(src: string): UseHtmlAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // State for isPlaying will now be derived from the audio element's actual state
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize audio element and attach core event listeners once
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
        // Do not set isPlaying here, let the polling handle it
      };
      const onVolumeChange = () => {
        if (audioRef.current) {
          setVolumeState(audioRef.current.volume);
          setIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
        }
      };

      audio.addEventListener("error", onError);
      audio.addEventListener("volumechange", onVolumeChange);

      return () => {
        audio.pause();
        audio.removeEventListener("error", onError);
        audio.removeEventListener("volumechange", onVolumeChange);
        // Clear polling interval on unmount
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, []); // Empty dependency array: runs only once on mount

  // Effect to sync `src` prop with audio element and manage polling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear any existing polling interval when src changes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (src && audio.src !== src) {
      audio.src = src;
      audio.load(); // Load the new source
      setIsPlaying(false); // Reset playing state when source changes
    } else if (!src && audio.src) {
      audio.src = '';
      audio.load();
      setIsPlaying(false);
    }

    // Start polling for isPlaying state
    intervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setIsPlaying(!audioRef.current.paused);
      }
    }, 100); // Poll every 100ms for responsiveness

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [src]); // Dependency on src: runs when src prop changes

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.warn("[useClientAudio] Audio element not initialized.");
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
    }
  }, []);

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

  return { audioRef, isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute };
}