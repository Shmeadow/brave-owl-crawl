"use client";  

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner"; // Ensure toast is imported

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
  const [isPlaying, setIsPlaying] = useState(false); // Track playing state
  const [volume, setVolumeState] = useState(0.5); // Default volume 0-1
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume); // To store volume before muting

  // Initialize audio element and attach event listeners once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.loop = true; // Ensure ambient sounds loop
      audioRef.current.volume = volume; // Set initial volume
      audioRef.current.muted = isMuted; // Set initial mute state

      const audio = audioRef.current;

      const onError = (e: Event) => {
        console.error(`[useClientAudio] load error for ${audio.src}:`, e);
        toast.error(`Failed to load audio: ${audio.src.split('/').pop()}. Please ensure the file exists and is accessible.`);
        setIsPlaying(false); // Stop playing on error
      };
      const onPlay = () => {
        setIsPlaying(true);
      };
      const onPause = () => {
        setIsPlaying(false);
      };
      const onEnded = () => setIsPlaying(false); // Also handle when loop ends (though loop is true)
      const onVolumeChange = () => { // Listen to native volume changes
        if (audioRef.current) {
          setVolumeState(audioRef.current.volume);
          setIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
        }
      };

      audio.addEventListener("error", onError);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("volumechange", onVolumeChange); // New listener

      return () => {
        // Cleanup listeners when component unmounts
        audio.pause();
        audio.removeEventListener("error", onError);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("volumechange", onVolumeChange); // Remove listener
      };
    }
  }, []); // Empty dependency array: runs only once on mount

  // Update src and load when src prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== src) {
      audio.src = src;
      audio.load(); // Load the new source
      setIsPlaying(false); // Pause when source changes
    }
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
      setIsPlaying(false); // Ensure state is correct if play fails
    }
  }, []); // No dependencies needed as audioRef.current is stable

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []); // No dependencies needed as audioRef.current is stable

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]); // Depend on isPlaying, play, and pause

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