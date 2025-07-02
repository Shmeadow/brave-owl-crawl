"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPlayer } from '@/components/media-player-context'; // Import the new context

// Declare YT globally for TypeScript
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export function useYouTubePlayer(youtubeEmbedUrl: string | null) {
  const { activePlayer, setActivePlayer } = useMediaPlayer(); // Use the media player context
  const playerRef = useRef<any>(null); // YT.Player instance
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume
  const [isMuted, setIsMuted] = useState(false); // New state for mute
  const [lastVolume, setLastVolume] = useState(50); // Store volume before muting
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

      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          setIsYTAPIReady(true);
          console.log("YouTube IFrame API is ready globally.");
        };
      } else {
        if (window.YT && window.YT.Player) {
          setIsYTAPIReady(true);
        }
      }
    } else {
      setIsYTAPIReady(true);
    }
  }, []);

  // 2. Initialize player when YT API is ready, videoId is available, and container ref is available
  useEffect(() => {
    if (!isYTAPIReady || !videoId || !iframeContainerRef.current || typeof window === 'undefined') {
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

    // Destroy existing player if videoId changes or a new player needs to be created
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

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
        mute: 0, // Start unmuted, control via setVolume
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
  }, [isYTAPIReady, videoId]); // Re-create player if videoId changes

  // Effect to handle play/pause based on activePlayer from context
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    if (activePlayer === 'youtube') {
      if (!isPlaying) {
        playerRef.current.playVideo();
      }
    } else {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      }
    }
  }, [activePlayer, playerReady, isPlaying]);

  const onPlayerReady = useCallback((event: any) => {
    setPlayerReady(true);
    event.target.setVolume(volume);
    // Only play if YouTube is the active player or no player is active
    if (activePlayer === 'youtube' || activePlayer === null) {
      event.target.playVideo();
      setActivePlayer('youtube');
    } else {
      event.target.pauseVideo();
    }
    setDuration(event.target.getDuration());
    setVideoTitle(event.target.getVideoData().title || "Unknown Title");
    startProgressInterval(event.target);
  }, [volume, activePlayer, setActivePlayer]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (window.YT) {
      if (event.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        setActivePlayer('youtube'); // Ensure YouTube is active when it starts playing
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
  }, [setActivePlayer]);

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
        setActivePlayer(null); // No player is active if paused
      } else {
        playerRef.current.playVideo();
        setActivePlayer('youtube'); // Set YouTube as active
      }
    }
  }, [isPlaying, playerReady, setActivePlayer]);

  const setVolume = useCallback((vol: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(vol);
      setVolumeState(vol);
      if (vol > 0) {
        setIsMuted(false);
        setLastVolume(vol); // Update lastVolume only if not muting
      } else {
        setIsMuted(true);
      }
    }
  }, [playerReady]);

  const toggleMute = useCallback(() => {
    if (playerReady && playerRef.current) {
      if (isMuted) {
        playerRef.current.setVolume(lastVolume);
        setVolumeState(lastVolume);
        setIsMuted(false);
      } else {
        setLastVolume(volume); // Store current volume before muting
        playerRef.current.setVolume(0);
        setVolumeState(0);
        setIsMuted(true);
      }
    }
  }, [isMuted, volume, lastVolume, playerReady]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);

  return {
    playerReady,
    isPlaying,
    volume,
    isMuted, // Expose isMuted
    currentTime,
    duration,
    videoTitle,
    togglePlayPause,
    setVolume,
    toggleMute, // Expose toggleMute
    formatTime,
    iframeContainerRef,
  };
}