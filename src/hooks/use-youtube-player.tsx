"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Declare global YT object for TypeScript
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any; // YouTube API object
  }
}

interface UseYouTubePlayerResult {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
  playerReady: boolean;
  youtubeCurrentTime: number;
  youtubeDuration: number;
}

export function useYouTubePlayer(embedUrl: string | null, iframeRef: React.RefObject<HTMLIFrameElement>): UseYouTubePlayerResult {
  const playerRef = useRef<any>(null); // YT.Player instance
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume 0-100
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(50); // To store volume before muting
  const [playerReady, setPlayerReady] = useState(false);
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);

  const clearTimeUpdateInterval = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  const onPlayerReady = useCallback((event: any) => {
    console.log("YouTube Player Ready:", event.target);
    setPlayerReady(true);
    event.target.setVolume(volume);
    setIsPlaying(event.target.getPlayerState() === window.YT.PlayerState.PLAYING);
    setIsMuted(event.target.isMuted());
    setYoutubeDuration(event.target.getDuration());
    setYoutubeCurrentTime(event.target.getCurrentTime());
    
    // Try to play immediately if not already playing (might be blocked by browser)
    if (event.target.getPlayerState() !== window.YT.PlayerState.PLAYING) {
      event.target.playVideo().catch((e: any) => console.warn("Autoplay blocked or error playing video:", e));
    }

    clearTimeUpdateInterval();
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setYoutubeCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  }, [volume, clearTimeUpdateInterval]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (window.YT) {
      setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
      if (event.data === window.YT.PlayerState.PLAYING) {
        clearTimeUpdateInterval();
        timeUpdateIntervalRef.current = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            setYoutubeCurrentTime(playerRef.current.getCurrentTime());
          }
        }, 1000);
      } else {
        clearTimeUpdateInterval();
        if (event.data === window.YT.PlayerState.ENDED) {
          setYoutubeCurrentTime(0);
        }
      }
    }
  }, [clearTimeUpdateInterval]);

  // Effect for cleanup when embedUrl changes or component unmounts
  useEffect(() => {
    return () => {
      console.log("YouTube Player Cleanup Effect: Destroying player and clearing interval.");
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      clearTimeUpdateInterval();
      setPlayerReady(false);
      setIsPlaying(false);
      setYoutubeCurrentTime(0);
      setYoutubeDuration(0);
      // Ensure global callback is cleaned if it was set by this instance
      if (typeof window !== 'undefined' && window.onYouTubeIframeAPIReady === initializeYouTubePlayer) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [embedUrl, clearTimeUpdateInterval]); // Only re-run cleanup when embedUrl changes

  // Effect for player initialization/loading when embedUrl or iframeRef.current changes
  const initializeYouTubePlayer = useCallback(() => {
    const videoIdMatch = embedUrl?.match(/\/embed\/([\w-]+)/);
    const currentVideoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!currentVideoId || !iframeRef.current || !window.YT || !window.YT.Player) {
      console.log("YouTube API or iframe not ready for player creation/update.");
      return;
    }

    if (playerRef.current) {
      console.log("YouTube player exists, loading new video:", currentVideoId);
      playerRef.current.loadVideoById(currentVideoId);
      playerRef.current.setVolume(volume);
      playerRef.current.unMute();
      setIsMuted(false);
      playerRef.current.playVideo().catch((e: any) => console.warn("Autoplay blocked on loadVideoById:", e));
    } else {
      console.log("Creating new YouTube player for video:", currentVideoId);
      playerRef.current = new window.YT.Player(iframeRef.current, {
        videoId: currentVideoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: currentVideoId,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
        },
      });
    }
  }, [embedUrl, iframeRef.current, onPlayerReady, onPlayerStateChange, volume]);

  useEffect(() => {
    const videoIdMatch = embedUrl?.match(/\/embed\/([\w-]+)/);
    const currentVideoId = videoIdMatch ? videoIdMatch[1] : null;

    if (currentVideoId && iframeRef.current) {
      if (window.YT && window.YT.Player) {
        initializeYouTubePlayer();
      } else {
        // If API not ready, set a global callback.
        // This needs to be careful not to overwrite other callbacks.
        // For simplicity, assuming this is the primary YT player.
        window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
      }
    } else {
      // If no valid embedUrl or iframeRef.current is null, ensure player is destroyed
      console.log("No valid embedUrl or iframeRef.current is null. Ensuring player is destroyed.");
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setPlayerReady(false);
      setIsPlaying(false);
      setYoutubeCurrentTime(0);
      setYoutubeDuration(0);
      clearTimeUpdateInterval();
    }
  }, [embedUrl, iframeRef.current, initializeYouTubePlayer, clearTimeUpdateInterval]); // Dependencies for this effect

  const togglePlayPause = useCallback(() => {
    if (playerReady && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        player.current.playVideo().catch((e: any) => console.warn("Manual play blocked or error:", e));
      }
    }
  }, [isPlaying, playerReady]);

  const setVolume = useCallback((vol: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(vol);
      setVolumeState(vol);
      setIsMuted(vol === 0);
      if (vol > 0) {
        prevVolumeRef.current = vol;
      }
    }
  }, [playerReady]);

  const toggleMute = useCallback(() => {
    if (playerReady && playerRef.current) {
      if (playerRef.current.isMuted()) {
        playerRef.current.unMute();
        setVolumeState(prevVolumeRef.current > 0 ? prevVolumeRef.current : 50);
        setIsMuted(false);
      } else {
        prevVolumeRef.current = playerRef.current.getVolume();
        playerRef.current.mute();
        setVolumeState(0);
        setIsMuted(true);
      }
    }
  }, [playerReady]);

  const seekTo = useCallback((seconds: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  }, [playerReady]);

  return {
    isPlaying,
    volume,
    isMuted,
    togglePlayPause,
    setVolume,
    toggleMute,
    seekTo,
    playerReady,
    youtubeCurrentTime,
    youtubeDuration,
  };
}