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
    setIsPlaying(event.target.getPlayerState() === window.YT.PlayerState.PLAYING);
    setIsMuted(event.target.isMuted());
    setYoutubeDuration(event.target.getDuration());
    setYoutubeCurrentTime(event.target.getCurrentTime());
    
    // Try to play immediately if not already playing (might be blocked by browser)
    if (event.target.getPlayerState() !== window.YT.PlayerState.PLAYING) {
      event.target.playVideo(); // Removed .catch()
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
    const newVideoIdMatch = embedUrl?.match(/\/embed\/([\w-]+)/);
    const newVideoId = newVideoIdMatch ? newVideoIdMatch[1] : null;

    const createOrUpdatePlayer = () => {
      if (!newVideoId || !iframeRef.current || !window.YT || !window.YT.Player) {
        console.log("YouTube API or iframe not ready for player creation/update.");
        return;
      }

      if (playerRef.current) {
        // Player exists
        if (currentVideoIdRef.current === newVideoId) {
          // Same video, just ensure state is correct (e.g., if it was paused externally)
          console.log("YouTube player exists, same video. Ensuring state.");
          if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
            playerRef.current.playVideo(); // Removed .catch()
          }
        } else {
          // Different video, load new video
          console.log("YouTube player exists, loading new video:", newVideoId);
          playerRef.current.loadVideoById(newVideoId); // Removed .catch()
          playerRef.current.setVolume(volume);
          playerRef.current.unMute();
          setIsMuted(false);
          setIsPlaying(true); // Assume play on load
          currentVideoIdRef.current = newVideoId;
        }
      } else {
        // Create new player
        console.log("Creating new YouTube player for video:", newVideoId);
        playerRef.current = new window.YT.Player(iframeRef.current, {
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

    if (newVideoId && iframeRef.current) {
      if (window.YT && window.YT.Player) {
        createOrUpdatePlayer();
      } else {
        // If API not ready, set a global callback.
        // This is crucial for when the script loads *after* the component mounts.
        window.onYouTubeIframeAPIReady = createOrUpdatePlayer;
      }
    } else {
      // If no valid embedUrl or iframeRef.current is null, destroy player
      console.log("No valid embedUrl or iframeRef.current is null. Destroying player.");
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

    // Cleanup function for this effect (component unmounts or embedUrl changes to non-YouTube)
    return () => {
      // Only destroy if switching away from YouTube or component unmounts
      // If newVideoId is null, it means we are switching away from YouTube or unmounting
      // If newVideoId is not null, but playerRef.current is null, it means the iframe itself was unmounted
      if (!newVideoId || !iframeRef.current) { 
        if (playerRef.current) {
          console.log("YouTube Player Cleanup: Destroying player.");
          playerRef.current.destroy();
          playerRef.current = null;
          setPlayerReady(false);
          setIsPlaying(false);
          setYoutubeCurrentTime(0);
          setYoutubeDuration(0);
          clearTimeUpdateInterval();
          currentVideoIdRef.current = null;
        }
      }
      // Remove global callback if it was set by this instance
      if (typeof window !== 'undefined' && window.onYouTubeIframeAPIReady === createOrUpdatePlayer) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [embedUrl, iframeRef, volume, onPlayerReady, onPlayerStateChange, clearTimeUpdateInterval]);


  const togglePlayPause = useCallback(() => {
    if (playerReady && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo(); // Removed .catch()
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