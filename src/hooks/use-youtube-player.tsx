"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { getYouTubeContentIdAndType } from '@/lib/utils'; // Import the new utility

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
  const currentContentIdRef = useRef<string | null>(null); // Tracks videoId or playlistId

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(50);
  const [playerReady, setPlayerReady] = useState(false);
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);

  // Use a ref to hold the latest state setters. This makes the callbacks below stable.
  const stateSettersRef = useRef({
    setIsPlaying,
    setYoutubeCurrentTime,
    setYoutubeDuration,
    setPlayerReady,
    setIsMuted,
  });
  useEffect(() => {
    stateSettersRef.current = {
      setIsPlaying,
      setYoutubeCurrentTime,
      setYoutubeDuration,
      setPlayerReady,
      setIsMuted,
    };
  });

  const clearTimeUpdateInterval = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  // These callbacks are passed to the YouTube player. They are now stable because their
  // dependencies are empty, and they access state setters through a ref.
  const onPlayerReady = useCallback((event: any) => {
    console.log("YouTube Player Ready:", event.target);
    stateSettersRef.current.setPlayerReady(true);
    event.target.setVolume(volume);
    stateSettersRef.current.setIsMuted(event.target.isMuted());
    stateSettersRef.current.setYoutubeDuration(event.target.getDuration());
    stateSettersRef.current.setYoutubeCurrentTime(event.target.getCurrentTime());
    
    event.target.playVideo(); 

    clearTimeUpdateInterval();
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        stateSettersRef.current.setYoutubeCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  }, [volume, clearTimeUpdateInterval]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (window.YT) {
      const isNowPlaying = event.data === window.YT.PlayerState.PLAYING;
      stateSettersRef.current.setIsPlaying(isNowPlaying);

      if (isNowPlaying) {
        clearTimeUpdateInterval();
        timeUpdateIntervalRef.current = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            stateSettersRef.current.setYoutubeCurrentTime(playerRef.current.getCurrentTime());
          }
        }, 1000);
      } else {
        clearTimeUpdateInterval();
        if (event.data === window.YT.PlayerState.ENDED) {
          stateSettersRef.current.setYoutubeCurrentTime(0);
        }
      }
    }
  }, [clearTimeUpdateInterval]);

  // Effect to load YouTube IFrame API script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "youtube-iframe-api-script";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Effect to manage player instance based on embedUrl and iframeRef
  useEffect(() => {
    const iframeElement = iframeRef.current;
    const { id: newContentId, type: newContentType } = embedUrl ? getYouTubeContentIdAndType(embedUrl) : { id: null, type: null };

    const createOrUpdatePlayer = () => {
      if (!newContentId || !newContentType || !iframeElement || !window.YT || !window.YT.Player) {
        return;
      }

      // Define common playerVars
      const commonPlayerVars = {
        autoplay: 1,
        loop: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: window.location.origin,
      };

      if (playerRef.current) {
        if (currentContentIdRef.current !== newContentId) {
          console.log("YouTube player exists, loading new content:", newContentId, "Type:", newContentType);
          if (newContentType === 'video') {
            playerRef.current.loadVideoById(newContentId);
          } else if (newContentType === 'playlist') {
            playerRef.current.loadPlaylist({ list: newContentId, listType: 'playlist' });
          }
          currentContentIdRef.current = newContentId;
        }
      } else {
        console.log("Creating new YouTube player for content:", newContentId, "Type:", newContentType);
        const playerOptions: any = {
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
          },
        };

        if (newContentType === 'video') {
          playerOptions.videoId = newContentId;
          playerOptions.playerVars = { ...commonPlayerVars, playlist: newContentId }; // playlist needed for looping single video
        } else if (newContentType === 'playlist') {
          playerOptions.playerVars = { ...commonPlayerVars, listType: 'playlist', list: newContentId };
        }
        
        playerRef.current = new window.YT.Player(iframeElement, playerOptions);
        currentContentIdRef.current = newContentId;
      }
    };

    if (newContentId && newContentType && iframeElement) {
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
      currentContentIdRef.current = null;
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