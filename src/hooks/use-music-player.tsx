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
    index: number;
    total: number;
    name: string;
    bgColor: string; // Added bgColor here
  } | null;
  togglePlayPause: () => void;
  setVolume: (newVolume: number) => void;
  toggleMute: () => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
}

// Define your Lofi Chill playlist here with a bgColor for each track
const LOFI_PLAYLIST = [
  { src: "/lofi-chill-1.mp3", name: "Lofi Chill Track 1", bgColor: "rgba(100, 149, 237, 0.2)" }, // Subtle blue
  { src: "/lofi-chill-2.mp3", name: "Lofi Chill Track 2", bgColor: "rgba(144, 238, 144, 0.2)" }, // Subtle green
  { src: "/lofi-chill-3.mp3", name: "Lofi Chill Track 3", bgColor: "rgba(255, 165, 0, 0.2)" }, // Subtle orange
  // Add more tracks here if you have them in your public folder
];

const LOCAL_STORAGE_AUDIO_PLAYING_KEY = 'lofi_audio_playing';
const LOCAL_STORAGE_AUDIO_TRACK_INDEX_KEY = 'lofi_audio_track_index';

export function useMusicPlayer(): MusicPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume 50%
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrackInfo, setCurrentTrackInfo] = useState<{ currentTime: number; duration: number; index: number; total: number; name: string; bgColor: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize audioRef and set up event listeners
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedPlayingState = localStorage.getItem(LOCAL_STORAGE_AUDIO_PLAYING_KEY);
      const savedTrackIndex = localStorage.getItem(LOCAL_STORAGE_AUDIO_TRACK_INDEX_KEY);
      
      const initialTrackIndex = savedTrackIndex ? parseInt(savedTrackIndex, 10) : 0;
      setCurrentTrackIndex(initialTrackIndex);

      // Create audio element if it doesn't exist (it's now managed by MusicPlayerBar)
      if (!audioRef.current) {
        audioRef.current = document.createElement('audio');
        audioRef.current.id = "lofi-audio-player";
        audioRef.current.loop = true;
        document.body.appendChild(audioRef.current); // Append to body or a specific container
      }

      const audioEl = audioRef.current;
      audioEl.src = LOFI_PLAYLIST[initialTrackIndex]?.src || '';

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleVolumeChange = () => {
        if (audioEl) {
          setVolumeState(audioEl.volume * 100);
          setIsMuted(audioEl.muted);
        }
      };
      const handleTimeUpdate = () => {
        if (audioEl) {
          setCurrentTrackInfo({
            currentTime: audioEl.currentTime,
            duration: audioEl.duration,
            index: currentTrackIndex,
            total: LOFI_PLAYLIST.length,
            name: LOFI_PLAYLIST[currentTrackIndex]?.name || 'Unknown',
            bgColor: LOFI_PLAYLIST[currentTrackIndex]?.bgColor || 'transparent',
          });
        }
      };
      const handleLoadedMetadata = () => {
        if (audioEl) {
          setCurrentTrackInfo({
            currentTime: audioEl.currentTime,
            duration: audioEl.duration,
            index: currentTrackIndex,
            total: LOFI_PLAYLIST.length,
            name: LOFI_PLAYLIST[currentTrackIndex]?.name || 'Unknown',
            bgColor: LOFI_PLAYLIST[currentTrackIndex]?.bgColor || 'transparent',
          });
        }
      };
      const handleEnded = () => {
        // If not looping, go to next track
        if (!audioEl.loop) {
          playNextTrack();
        }
      };

      audioEl.addEventListener("play", handlePlay);
      audioEl.addEventListener("pause", handlePause);
      audioEl.addEventListener("volumechange", handleVolumeChange);
      audioEl.addEventListener("timeupdate", handleTimeUpdate);
      audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioEl.addEventListener("ended", handleEnded);

      // Set initial volume and mute state from audio element
      setVolumeState(audioEl.volume * 100);
      setIsMuted(audioEl.muted);
      setIsPlaying(!audioEl.paused);

      // Attempt to play if it was playing before, but handle autoplay policy
      if (savedPlayingState === 'true') {
        audioEl.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.warn("Autoplay prevented:", error);
          setIsPlaying(false);
        });
      }

      return () => {
        audioEl.removeEventListener("play", handlePlay);
        audioEl.removeEventListener("pause", handlePause);
        audioEl.removeEventListener("volumechange", handleVolumeChange);
        audioEl.removeEventListener("timeupdate", handleTimeUpdate);
        audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audioEl.removeEventListener("ended", handleEnded);
        // Do not remove audioEl from DOM here, as it's managed by MusicPlayerBar
      };
    }
  }, [currentTrackIndex, mounted]); // Re-run effect when track index changes

  // Update audio element volume and mute when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Persist playing state and track index to local storage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_AUDIO_PLAYING_KEY, String(isPlaying));
      localStorage.setItem(LOCAL_STORAGE_AUDIO_TRACK_INDEX_KEY, String(currentTrackIndex));
    }
  }, [isPlaying, currentTrackIndex, mounted]);

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

  const playNextTrack = useCallback(() => {
    if (LOFI_PLAYLIST.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % LOFI_PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
    if (audioRef.current) {
      audioRef.current.src = LOFI_PLAYLIST[nextIndex].src;
      audioRef.current.load(); // Load the new source
      if (isPlaying) {
        audioRef.current.play();
      }
    }
    toast.info(`Playing next track: ${LOFI_PLAYLIST[nextIndex].name}`);
  }, [currentTrackIndex, isPlaying]);

  const playPreviousTrack = useCallback(() => {
    if (LOFI_PLAYLIST.length === 0) return;
    const prevIndex = (currentTrackIndex - 1 + LOFI_PLAYLIST.length) % LOFI_PLAYLIST.length;
    setCurrentTrackIndex(prevIndex);
    if (audioRef.current) {
      audioRef.current.src = LOFI_PLAYLIST[prevIndex].src;
      audioRef.current.load(); // Load the new source
      if (isPlaying) {
        audioRef.current.play();
      }
    }
    toast.info(`Playing previous track: ${LOFI_PLAYLIST[prevIndex].name}`);
  }, [currentTrackIndex, isPlaying]);

  return {
    isPlaying,
    volume,
    isMuted,
    currentTrack: currentTrackInfo,
    togglePlayPause,
    setVolume,
    toggleMute,
    playNextTrack,
    playPreviousTrack,
  };
}