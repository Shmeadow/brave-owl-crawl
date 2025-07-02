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
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  seekTo: (seconds: number) => void; // New: Expose seekTo
  playerReady: boolean;
  iframeId: string; // ID to assign to the iframe
  youtubeCurrentTime: number; // Exposed current time
  youtubeDuration: number; // Exposed duration
}

export function useYouTubePlayer(embedUrl: string | null): UseYouTubePlayerResult {
  const playerRef = useRef<any>(null); // YT.Player instance
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume 0-100
  const [playerReady, setPlayerReady] = useState(false);
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);
  const iframeId = useRef(`youtube-player-${Math.random().toString(36).substring(2, 9)}`).current;
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeUpdateInterval = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!embedUrl) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setPlayerReady(false);
      setIsPlaying(false);
      setYoutubeCurrentTime(0);
      setYoutubeDuration(0);
      clearTimeUpdateInterval();
      return;
    }

    // Extract video ID from embed URL
    const videoIdMatch = embedUrl.match(/\/embed\/([\w-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      console.error("Invalid YouTube embed URL provided:", embedUrl);
      return;
    }

    // Load YouTube IFrame API script
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const onPlayerReady = (event: any) => {
      setPlayerReady(true);
      event.target.setVolume(volume);
      setIsPlaying(event.target.getPlayerState() === window.YT.PlayerState.PLAYING);
      setYoutubeDuration(event.target.getDuration());
      setYoutubeCurrentTime(event.target.getCurrentTime());
      
      // Start polling for current time if already playing
      if (event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
        timeUpdateIntervalRef.current = setInterval(() => {
          setYoutubeCurrentTime(event.target.getCurrentTime());
        }, 1000);
      }
    };

    const onPlayerStateChange = (event: any) => {
      if (window.YT) {
        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        if (event.data === window.YT.PlayerState.PLAYING) {
          clearTimeUpdateInterval(); // Clear any existing interval
          timeUpdateIntervalRef.current = setInterval(() => {
            setYoutubeCurrentTime(event.target.getCurrentTime());
          }, 1000);
        } else {
          clearTimeUpdateInterval();
          if (event.data === window.YT.PlayerState.ENDED) {
            setYoutubeCurrentTime(0); // Reset to 0 when ended
          }
        }
      }
    };

    const createPlayer = () => {
      if (window.YT && window.YT.Player && document.getElementById(iframeId)) {
        if (playerRef.current) {
          playerRef.current.destroy(); // Destroy existing player if any
        }
        playerRef.current = new window.YT.Player(iframeId, {
          videoId: videoId,
          playerVars: {
            autoplay: 1, // Autoplay on load
            loop: 1,
            playlist: videoId, // Required for loop
            controls: 0, // Hide controls for custom UI
            modestbranding: 1,
            rel: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            enablejsapi: 1, // Enable JavaScript API
            origin: window.location.origin, // Crucial for API to work
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
          },
        });
      }
    };

    // Ensure API is ready before creating player
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // If API not ready, set a global callback
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      clearTimeUpdateInterval();
      // Clean up global callback if component unmounts before API is ready
      if (window.onYouTubeIframeAPIReady === createPlayer) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [embedUrl, iframeId, volume, clearTimeUpdateInterval]); // Re-create player if embedUrl changes, or volume for initial set

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

  const seekTo = useCallback((seconds: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  }, [playerReady]);

  return {
    isPlaying,
    volume,
    togglePlayPause,
    setVolume,
    seekTo, // Expose seekTo
    playerReady,
    iframeId,
    youtubeCurrentTime,
    youtubeDuration,
  };
}