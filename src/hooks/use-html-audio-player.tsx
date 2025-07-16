"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/context/toast-visibility-provider'; // Updated toast import

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioVolume, setAudioVolumeState] = useState(0.7);
  const [audioIsMuted, setAudioIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const prevAudioVolumeRef = useRef(audioVolume);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = audioVolume;
      audioRef.current.muted = audioIsMuted;
      audioRef.current.autoplay = false;

      const handlePlay = () => {
        setAudioIsPlaying(true);
      };
      const handlePause = () => {
        setAudioIsPlaying(false);
      };
      const handleVolumeChange = () => {
        if (audioRef.current) {
          setAudioVolumeState(audioRef.current.volume);
          setAudioIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
        }
      };
      const handleError = (e: Event) => {
        console.error(`[useHtmlAudioPlayer] Audio element error for ${audioRef.current?.src}:`, e);
        toast.error(`Audio playback error: Failed to load or play sound. Check console for details.`);
        setAudioIsPlaying(false);
        setIsReadyToPlay(false);
      };
      const handleCanPlayThrough = () => {
        setIsReadyToPlay(true);
      };
      const handleWaiting = () => {
        setIsReadyToPlay(false);
      };
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration);
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
      };


      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('volumechange', handleVolumeChange);
      audioRef.current.addEventListener('error', handleError);
      audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough);
      audioRef.current.addEventListener('waiting', handleWaiting);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);

      return () => {
        if (audioRef.current) {
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
          audioRef.current.src = '';
          audioRef.current.load();
        }
      };
    }
  }, [audioVolume, audioIsMuted]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (src && src !== audioRef.current.src) {
      setAudioIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setIsReadyToPlay(false);
      audioRef.current.src = src;
      audioRef.current.load();
    } else if (!src && audioRef.current.src) {
      setAudioIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setIsReadyToPlay(false);
      audioRef.current.src = '';
      audioRef.current.load();
    }
  }, [src]);

  useEffect(() => {
    if (!audioRef.current || !isReadyToPlay) {
      return;
    }

    if (audioIsPlaying) {
      audioRef.current.play()
        .then(() => {
        })
        .catch(error => {
          console.error(`[useHtmlAudioPlayer] Play promise rejected for ${audioRef.current?.src}:`, error);
          toast.error(`Failed to play audio: ${error.message || 'Unknown error'}. Please check the URL or browser autoplay settings.`);
          setAudioIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
    }
  }, [audioIsPlaying, isReadyToPlay]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioIsMuted ? 0 : audioVolume;
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