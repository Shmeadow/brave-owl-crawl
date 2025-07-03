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

export function useYouTubePlayer(embedUrl: string | null, iframeRef: React.RefObject<HTMLIFrameElement | null>): UseYouTubePlayerResult {
  const playerRef = useRef<any>(null); // YT.Player instance
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null); // To track the video ID currently loaded in the player

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
    setIsMuted(event.target.isMuted());
    setYoutubeDuration(event.target.getDuration());
    setYoutubeCurrentTime(event.target.getCurrentTime());
    
    // Try to play immediately, catching potential autoplay errors
    event.target.playVideo()?.catch((error: any) => {
      console.warn("Autoplay was prevented:", error);
      setIsPlaying(false);
    });

    clearTimeUpdateInterval();
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setYoutubeCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  }, [volume, clearTimeUpdateInterval]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (window.YT) {
      const isNowPlaying = event.data === window.YT.PlayerState.PLAYING;
      setIsPlaying(isNowPlaying);

      if (isNowPlaying) {
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

  // Effect to load YouTube IFrame API script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "youtube-iframe-api-script"; // Add an ID to prevent multiple loads
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Effect to manage player instance based on embedUrl and iframeRef
  useEffect(() => {
    const iframeElement = iframeRef.current; // Capture the ref's current value
    const newVideoIdMatch = embedUrl?.match(/\/embed\/([\w-]+)/);
    const newVideoId = newVideoIdMatch ? newVideoIdMatch[1] : null;

    const createOrUpdatePlayer = () => {
      if (!newVideoId || !iframeElement || !window.YT || !window.YT.Player) {
        return;
      }

      if (playerRef.current) {
        if (currentVideoIdRef.current !== newVideoId) {
          console.log("YouTube player exists, loading new video:", newVideoId);
          playerRef.current.loadVideoById(newVideoId);
          currentVideoIdRef.current = newVideoId;
        }
      } else {
        console.log("Creating new YouTube player for video:", newVideoId);
        playerRef.current = new window.YT.Player(iframeElement, {
          videoId: newVideoId,
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: newVideoId,
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
        currentVideoIdRef.current = newVideoId;
      }
    };

    if (newVideoId && iframeElement) {
      if (window.YT && window.YT.Player) {
        createOrUpdatePlayer();
      } else {
        window.onYouTubeIframeAPIReady = createOrUpdatePlayer;
      }
    } else {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setPlayerReady(false);
      setIsPlaying(false);
      setYoutubeCurrentTime(0);
      setYoutubeDuration(0);
      clearTimeUpdateInterval();
      currentVideoIdRef.current = null;
    }

    return () => {
      if (typeof window !== 'undefined' && window.onYouTubeIframeAPIReady === createOrUpdatePlayer) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [embedUrl, iframeRef, onPlayerReady, onPlayerStateChange, clearTimeUpdateInterval]);


  const togglePlayPause = useCallback(() => {
    if (playerReady && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo()?.catch((error: any) => console.warn("Play command failed:", error));
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