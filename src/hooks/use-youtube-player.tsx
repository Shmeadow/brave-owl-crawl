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

  useEffect(() => {
    // This effect handles player creation/update and destruction
    let currentVideoId: string | null = null;
    const videoIdMatch = embedUrl?.match(/\/embed\/([\w-]+)/);
    if (videoIdMatch) {
      currentVideoId = videoIdMatch[1];
    }

    // If no embedUrl or iframe is not in DOM, clean up player and reset states
    if (!currentVideoId || !iframeRef.current) {
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

    // Load YouTube IFrame API script if not already loaded
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
      setIsMuted(event.target.isMuted());
      setYoutubeDuration(event.target.getDuration());
      setYoutubeCurrentTime(event.target.getCurrentTime());
      
      if (event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
        clearTimeUpdateInterval();
        timeUpdateIntervalRef.current = setInterval(() => {
          setYoutubeCurrentTime(event.target.getCurrentTime());
        }, 1000);
      }
    };

    const onPlayerStateChange = (event: any) => {
      if (window.YT) {
        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        if (event.data === window.YT.PlayerState.PLAYING) {
          clearTimeUpdateInterval();
          timeUpdateIntervalRef.current = setInterval(() => {
            setYoutubeCurrentTime(event.target.getCurrentTime());
          }, 1000);
        } else {
          clearTimeUpdateInterval();
          if (event.data === window.YT.PlayerState.ENDED) {
            setYoutubeCurrentTime(0);
          }
        }
      }
    };

    const initializeOrLoadVideo = () => {
      if (!currentVideoId || !iframeRef.current || !window.YT || !window.YT.Player) {
        return; // Not ready to create or update player
      }

      if (playerRef.current) {
        // Player already exists, load new video
        playerRef.current.loadVideoById(currentVideoId);
        playerRef.current.setVolume(volume); // Ensure volume is maintained
        playerRef.current.unMute(); // Ensure it's unmuted if it was muted
        setIsMuted(false);
        setIsPlaying(true); // Assume play on load
      } else {
        // Create new player
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
    };

    // If API is already ready, try to create/update player immediately
    if (window.YT && window.YT.Player) {
      initializeOrLoadVideo();
    } else {
      // If API not ready, set a global callback
      window.onYouTubeIframeAPIReady = initializeOrLoadVideo;
    }

    // Cleanup function for this effect
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      clearTimeUpdateInterval();
      // Clear global callback if it was set by this instance
      if (typeof window !== 'undefined' && window.onYouTubeIframeAPIReady === initializeOrLoadVideo) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [embedUrl, iframeRef.current, volume, clearTimeUpdateInterval]); // Dependencies

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