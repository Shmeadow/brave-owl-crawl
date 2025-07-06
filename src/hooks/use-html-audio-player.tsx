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

  // Initialize audio element on first render and attach event listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = audioVolume;
      audioRef.current.muted = audioIsMuted;
      audioRef.current.autoplay = false; // Explicitly disable autoplay

      const handlePlay = () => {
        setAudioIsPlaying(true);
        console.log(`[useHtmlAudioPlayer] Audio element reported 'play' event for: ${audioRef.current?.src}`);
      };
      const handlePause = () => {
        setAudioIsPlaying(false);
        console.log(`[useHtmlAudioPlayer] Audio element reported 'pause' event for: ${audioRef.current?.src}`);
      };
      const handleVolumeChange = () => {
        if (audioRef.current) {
          setAudioVolumeState(audioRef.current.volume);
          setAudioIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
          console.log(`[useHtmlAudioPlayer] Volume changed to: ${audioRef.current.volume}, Muted: ${audioRef.current.muted}`);
        }
      };
      const handleError = (e: Event) => {
        console.error(`[useHtmlAudioPlayer] Audio element error for ${audioRef.current?.src}:`, e);
        toast.error(`Audio playback error: Failed to load or play sound. Check console for details.`);
        setAudioIsPlaying(false); // Ensure state is paused on error
      };

      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('volumechange', handleVolumeChange);
      audioRef.current.addEventListener('error', handleError);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('play', handlePlay);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('volumechange', handleVolumeChange);
          audioRef.current.removeEventListener('error', handleError);
          audioRef.current.pause();
          audioRef.current.src = ''; // Clear source
          audioRef.current.load(); // Ensure it's unloaded
          // Do NOT nullify audioRef.current here, as it's a persistent ref for the hook instance.
        }
      };
    }
  }, [audioVolume, audioIsMuted]); // Dependencies for initial setup and event listeners

  // Sync play/pause state with the audio element
  useEffect(() => {
    if (audioRef.current) {
      if (audioIsPlaying) {
        console.log(`[useHtmlAudioPlayer] Attempting to play audio via state change for: ${src}`);
        audioRef.current.play()
          .then(() => {
            console.log(`[useHtmlAudioPlayer] Play promise resolved for: ${src}`);
          })
          .catch(error => {
            console.error(`[useHtmlAudioPlayer] Play promise rejected for ${src}:`, error);
            toast.error(`Failed to play audio: ${error.message || 'Unknown error'}. Please check the URL or browser autoplay settings.`);
            setAudioIsPlaying(false); // Revert state if play fails
          });
      } else {
        console.log(`[useHtmlAudioPlayer] Attempting to pause audio via state change for: ${src}`);
        audioRef.current.pause();
      }
    }
  }, [audioIsPlaying, src]);

  // Sync volume/mute state (separate from initial setup)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioIsMuted ? 0 : audioVolume;
    }
  }, [audioVolume, audioIsMuted]);

  // Reset audio state when source changes
  useEffect(() => {
    if (audioRef.current && src !== audioRef.current.src) { // Only load if src actually changed
      console.log(`[useHtmlAudioPlayer] Source changed to: ${src}. Resetting audio state.`);
      setAudioIsPlaying(false); // Always pause when source changes
      setAudioCurrentTime(0);
      setAudioDuration(0);
      audioRef.current.src = src || ''; // Set new source
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