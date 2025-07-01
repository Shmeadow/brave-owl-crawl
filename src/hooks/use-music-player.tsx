"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface MusicPlayerState {
  isPlaying: boolean;
  volume: number; // 0-100
  isMuted: boolean;
  currentTrack: {
    currentTime: number;
    duration: number;
  } | null;
  togglePlayPause: () => void;
  setVolume: (newVolume: number) => void;
  toggleMute: () => void;
}

export function useMusicPlayer(): MusicPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume 50%
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{ currentTime: number; duration: number } | null>(null);

  // Initialize audioRef and set up event listeners
  useEffect(() => {
    const audioEl = document.getElementById("lofi-audio-player") as HTMLAudioElement;
    if (audioEl) {
      audioRef.current = audioEl;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleVolumeChange = () => {
        if (audioRef.current) {
          setVolumeState(audioRef.current.volume * 100);
          setIsMuted(audioRef.current.muted);
        }
      };
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTrack({
            currentTime: audioRef.current.currentTime,
            duration: audioRef.current.duration,
          });
        }
      };
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setCurrentTrack({
            currentTime: audioRef.current.currentTime,
            duration: audioRef.current.duration,
          });
        }
      };

      audioEl.addEventListener("play", handlePlay);
      audioEl.addEventListener("pause", handlePause);
      audioEl.addEventListener("volumechange", handleVolumeChange);
      audioEl.addEventListener("timeupdate", handleTimeUpdate);
      audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);

      // Set initial volume and mute state from audio element
      setVolumeState(audioEl.volume * 100);
      setIsMuted(audioEl.muted);
      setIsPlaying(!audioEl.paused);

      return () => {
        audioEl.removeEventListener("play", handlePlay);
        audioEl.removeEventListener("pause", handlePause);
        audioEl.removeEventListener("volumechange", handleVolumeChange);
        audioEl.removeEventListener("timeupdate", handleTimeUpdate);
        audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, []);

  // Update audio element volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

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

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      const clampedVolume = Math.max(0, Math.min(100, newVolume));
      audioRef.current.volume = clampedVolume / 100;
      if (clampedVolume > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
      setVolumeState(clampedVolume);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
      toast.info(audioRef.current.muted ? "Audio muted." : "Audio unmuted.");
    }
  }, []);

  return {
    isPlaying,
    volume,
    isMuted,
    currentTrack,
    togglePlayPause,
    setVolume,
    toggleMute,
  };
}