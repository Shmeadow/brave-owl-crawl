"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Declare YT globally for TypeScript
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export function useYouTubePlayer(youtubeEmbedUrl: string | null) {
  const playerRef = useRef<any>(null); // YT.Player instance
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Loading video...");
  const iframeContainerRef = useRef<HTMLDivElement>(null); // Ref for the div where player will be injected
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // State to track if the YT API script has loaded and YT object is available
  const [isYTAPIReady, setIsYTAPIReady] = useState(false);

  // Extract video ID from embed URL
  const getVideoId = useCallback((url: string | null) => {
    if (!url) return null;
    // This regex handles both standard watch URLs and embed URLs
    const match = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }, []);

  const videoId = getVideoId(youtubeEmbedUrl);

  // 1. Load YouTube IFrame API script and set global callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Set the global callback. This will be called by the YouTube API script.
      // It should only be set once globally.
      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          setIsYTAPIReady(true); // Signal that YT API is ready
          console.log("YouTube IFrame API is ready globally.");
        };
      } else {
        // If it's already set, it means the script might have loaded already
        // or another instance set it. Check if YT is available.
        if (window.YT && window.YT.Player) {
          setIsYTAPIReady(true);
        }
      }
    } else {
      // YT object already exists, so API is ready
      setIsYTAPIReady(true);
    }
  }, []); // Run once on mount

  // 2. Initialize player when YT API is ready, videoId is available, and container ref is available
  useEffect(() => {
    if (!isYTAPIReady || !videoId || !iframeContainerRef.current || typeof window === 'undefined') {
      // If conditions not met, ensure player is destroyed if it exists
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        setPlayerReady(false);
        setIsPlaying(false);
        setVideoTitle("No video loaded");
        setCurrentTime(0);
        setDuration(0);
      }
      return;
    }

    // Create the player
    const newPlayer = new window.YT.Player(iframeContainerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        loop: 1,
        playlist: videoId,
        mute: 0,
        enablejsapi: 1,
        origin: window.location.origin,
        widget_referrer: window.location.href,
        playsinline: 1,
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange,
        'onError': onPlayerError,
      },
    });
    playerRef.current = newPlayer;
    setPlayer(newPlayer); // Store in state for re-renders

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isYTAPIReady, videoId, youtubeEmbedUrl]); // Dependencies: API readiness, video ID, and the full URL

  // Callback functions for player events (useCallback to prevent re-creation)
  const onPlayerReady = useCallback((event: any) => {
    setPlayerReady(true);
    event.target.setVolume(volume);
    event.target.playVideo();
    setDuration(event.target.getDuration());
    setVideoTitle(event.target.getVideoData().title || "Unknown Title");
    setIsPlaying(true);
    startProgressInterval(event.target);
  }, [volume]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (window.YT) {
      if (event.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        startProgressInterval(event.target);
      } else {
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      if (event.data === window.YT.PlayerState.ENDED) {
        setCurrentTime(0);
      }
    }
  }, []);

  const onPlayerError = useCallback((event: any) => {
    console.error("YouTube Player Error:", event.data);
    setVideoTitle("Error loading video");
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startProgressInterval = useCallback((playerInstance: any) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (playerInstance && typeof playerInstance.getCurrentTime === 'function') {
        setCurrentTime(playerInstance.getCurrentTime());
      }
    }, 1000);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (playerReady && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  }, [isPlaying, playerReady]);

  const setVolume = useCallback((vol: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(vol);
      setVolumeState(vol);
    }
  }, [playerReady]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);

  return {
    playerReady,
    isPlaying,
    volume,
    currentTime,
    duration,
    videoTitle,
    togglePlayPause,
    setVolume,
    formatTime,
    iframeContainerRef,
  };
}