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
  onLoadedMetadata: () => void; // These are for external components that might render <audio> directly
  onTimeUpdate: () => void;     // but here they are internal to the hook.
  onEnded: () => void;
}

export function useHtmlAudioPlayer(src: string | null): UseHtmlAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null); // Initialize with null
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioVolume, setAudioVolumeState] = useState(0.7); // Default volume 0-1
  const [audioIsMuted, setAudioIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false); // New state for canplaythrough
  const prevAudioVolumeRef = useRef(audioVolume); // To store volume before muting

  // 1. Initialize audio element and attach core event listeners
  useEffect(() => {
    if (!audioRef.current) {
      // console.log("[useHtmlAudioPlayer] Initializing new Audio element."); // Removed for cleaner logs
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = audioVolume;
      audioRef.current.muted = audioIsMuted;
      audioRef.current.autoplay = false; // Explicitly disable autoplay

      const handlePlay = () => {
        setAudioIsPlaying(true);
        // console.log(`[useHtmlAudioPlayer] Audio element reported 'play' event for: ${audioRef.current?.src}`); // Removed for cleaner logs
      };
      const handlePause = () => {
        setAudioIsPlaying(false);
        // console.log(`[useHtmlAudioPlayer] Audio element reported 'pause' event for: ${audioRef.current?.src}`); // Removed for cleaner logs
      };
      const handleVolumeChange = () => {
        if (audioRef.current) {
          setAudioVolumeState(audioRef.current.volume);
          setAudioIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
          // console.log(`[useHtmlAudioPlayer] Volume changed to: ${audioRef.current.volume}, Muted: ${audioRef.current.muted}`); // Removed for cleaner logs
        }
      };
      const handleError = (e: Event) => {
        console.error(`[useHtmlAudioPlayer] Audio element error for ${audioRef.current?.src}:`, e);
        toast.error(`Audio playback error: Failed to load or play sound. Check console for details.`);
        setAudioIsPlaying(false); // Ensure state is paused on error
        setIsReadyToPlay(false); // Not ready if error
      };
      const handleCanPlayThrough = () => {
        setIsReadyToPlay(true);
        // console.log(`[useHtmlAudioPlayer] 'canplaythrough' event for: ${audioRef.current?.src}`); // Removed for cleaner logs
      };
      const handleWaiting = () => {
        setIsReadyToPlay(false); // Not ready if buffering
        // console.log(`[useHtmlAudioPlayer] 'waiting' event for: ${audioRef.current?.src}`); // Removed for cleaner logs
      };
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration);
          // console.log(`[useHtmlAudioPlayer] 'loadedmetadata' event. Duration: ${audioRef.current.duration}s`); // Removed for cleaner logs
        }
      };
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setAudioCurrentTime(audioRef.current.currentTime);
        }
      };
      const handleEnded = () => {
        setAudioIsPlaying(false);
        setAudioCurrentTime(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        // console.log("[useHtmlAudioPlayer] Audio ended."); // Removed for cleaner logs
      };


      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('volumechange', handleVolumeChange);
      audioRef.current.addEventListener('error', handleError);
      audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough); // New listener
      audioRef.current.addEventListener('waiting', handleWaiting); // New listener
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);

      return () => {
        if (audioRef.current) {
          // console.log("[useHtmlAudioPlayer] Cleaning up Audio element event listeners."); // Removed for cleaner logs
          audioRef.current.removeEventListener('play', handlePlay);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('volumechange', handleVolumeChange);
          audioRef.current.removeEventListener('error', handleError);
          audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
          audioRef.current.removeEventListener('waiting', handleWaiting);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.pause();
          audioRef.current.src = ''; // Clear source
          audioRef.current.load(); // Ensure it's unloaded
          // Do NOT nullify audioRef.current here, as it's a persistent ref for the hook instance.
        }
      };
    }
  }, [audioVolume, audioIsMuted]); // Dependencies for initial setup and event listeners

  // 2. Sync `src` prop with audio element
  useEffect(() => {
    if (!audioRef.current) return;

    if (src && src !== audioRef.current.src) {
      // console.log(`[useHtmlAudioPlayer] Setting new source: ${src}`); // Removed for cleaner logs
      setAudioIsPlaying(false); // Always pause when source changes
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setIsReadyToPlay(false); // Reset ready state
      audioRef.current.src = src;
      audioRef.current.load(); // Reload media when src changes
    } else if (!src && audioRef.current.src) {
      // If src becomes null, clear the audio element's source
      // console.log("[useHtmlAudioPlayer] Clearing audio source."); // Removed for cleaner logs
      setAudioIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setIsReadyToPlay(false);
      audioRef.current.src = '';
      audioRef.current.load();
    }
  }, [src]);

  // 3. Sync `audioIsPlaying` state with audio element, only if ready
  useEffect(() => {
    if (!audioRef.current || !isReadyToPlay) {
      // console.log(`[useHtmlAudioPlayer] Play/Pause sync skipped. Player ready: ${isReadyToPlay}, Audio element: ${!!audioRef.current}`); // Removed for cleaner logs
      return;
    }

    if (audioIsPlaying) {
      // console.log(`[useHtmlAudioPlayer] Attempting to play audio via state change for: ${audioRef.current.src}`); // Removed for cleaner logs
      audioRef.current.play()
        .then(() => {
          // console.log(`[useHtmlAudioPlayer] Play promise resolved for: ${audioRef.current?.src}`); // Removed for cleaner logs
        })
        .catch(error => {
          console.error(`[useHtmlAudioPlayer] Play promise rejected for ${audioRef.current?.src}:`, error);
          toast.error(`Failed to play audio: ${error.message || 'Unknown error'}. Please check the URL or browser autoplay settings.`);
          setAudioIsPlaying(false); // Revert state if play fails
        });
    } else {
      // console.log(`[useHtmlAudioPlayer] Attempting to pause audio via state change for: ${audioRef.current.src}`); // Removed for cleaner logs
      audioRef.current.pause();
    }
  }, [audioIsPlaying, isReadyToPlay]); // Depend on isReadyToPlay

  // 4. Sync volume/mute state (separate from initial setup)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioIsMuted ? 0 : audioVolume;
      // console.log(`[useHtmlAudioPlayer] Volume/Mute sync. Volume: ${audioRef.current.volume}, Muted: ${audioRef.current.muted}`); // Removed for cleaner logs
    }
  }, [audioVolume, audioIsMuted]);

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
      // console.log(`[useHtmlAudioPlayer] Seeked to: ${seconds}s`); // Removed for cleaner logs
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioDuration);
      setAudioCurrentTime(audioRef.current.currentTime);
      // console.log(`[useHtmlAudioPlayer] Skipped forward to: ${audioRef.current.currentTime}s`); // Removed for cleaner logs
    }
  }, [audioDuration]);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      setAudioCurrentTime(audioRef.current.currentTime);
      // console.log(`[useHtmlAudioPlayer] Skipped backward to: ${audioRef.current.currentTime}s`); // Removed for cleaner logs
    }
  }, []);

  // These are exposed for external components that might render <audio> directly,
  // but within this hook, they are handled by internal event listeners.
  // They are kept for interface consistency if needed elsewhere.
  const onLoadedMetadata = useCallback(() => { /* Handled internally */ }, []);
  const onTimeUpdate = useCallback(() => { /* Handled internally */ }, []);
  const onEnded = useCallback(() => { /* Handled internally */ }, []);

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