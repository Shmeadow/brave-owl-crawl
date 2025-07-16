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

  // Use a ref to hold the latest state values and setters.
  // This allows stable callbacks to access the most current state without
  // needing to be re-created on every state change.
  const latestState = useRef({
    isPlaying, setIsPlaying,
    volume, setVolumeState,
    isMuted, setIsMuted,
    prevVolumeRef,
    playerReady, setPlayerReady,
    youtubeCurrentTime, setYoutubeCurrentTime,
    youtubeDuration, setYoutubeDuration,
    clearTimeUpdateInterval: () => { /* placeholder, will be updated below */ }
  });

  // Update the ref on every render
  useEffect(() => {
    latestState.current = {
      isPlaying, setIsPlaying,
      volume, setVolumeState,
      isMuted, setIsMuted,
      prevVolumeRef,
      playerReady, setPlayerReady,
      youtubeCurrentTime, setYoutubeCurrentTime,
      youtubeDuration, setYoutubeDuration,
      clearTimeUpdateInterval: latestState.current.clearTimeUpdateInterval // Keep the stable function
    };
  });

  const clearTimeUpdateInterval = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  // Update the clearTimeUpdateInterval in the ref once it's stable
  useEffect(() => {
    latestState.current.clearTimeUpdateInterval = clearTimeUpdateInterval;
  }, [clearTimeUpdateInterval]);


  const onPlayerReady = useCallback((event: any) => {
    const { setPlayerReady, setIsMuted, setYoutubeDuration, setYoutubeCurrentTime, volume } = latestState.current;
    setPlayerReady(true);
    event.target.setVolume(volume);
    setIsMuted(event.target.isMuted());
    setYoutubeDuration(event.target.getDuration());
    setYoutubeCurrentTime(event.target.getCurrentTime());
    
    event.target.playVideo(); 

    latestState.current.clearTimeUpdateInterval(); // Use the stable function from ref
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        latestState.current.setYoutubeCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  }, []); // Dependencies are empty because all accessed state/setters are via latestState.current

  const onPlayerStateChange = useCallback((event: any) => {
    const { setIsPlaying, setYoutubeCurrentTime } = latestState.current;
    if (window.YT) {
      const isNowPlaying = event.data === window.YT.PlayerState.PLAYING;
      setIsPlaying(isNowPlaying);

      if (isNowPlaying) {
        latestState.current.clearTimeUpdateInterval(); // Use the stable function from ref
        timeUpdateIntervalRef.current = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            latestState.current.setYoutubeCurrentTime(playerRef.current.getCurrentTime());
          }
        }, 1000);
      } else {
        latestState.current.clearTimeUpdateInterval(); // Use the stable function from ref
        if (event.data === window.YT.PlayerState.ENDED) {
          setYoutubeCurrentTime(0);
        }
      }
    }
  }, []); // Dependencies are empty

  // Effect to load YouTube IFrame API script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "youtube-iframe-api-script";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // This global function is called by the YouTube API when it's ready
      window.onYouTubeIframeAPIReady = () => {
        // When the API is ready, trigger the player creation/update logic
        // This will be handled by the main useEffect that depends on embedUrl and iframeRef
        // No direct call needed here, as the main useEffect will re-run when window.YT becomes available.
      };
    }
  }, []);

  // Effect to manage player instance based on embedUrl and iframeRef
  useEffect(() => {
    const iframeElement = iframeRef.current;
    const { id: newContentId, type: newContentType } = embedUrl ? getYouTubeContentIdAndType(embedUrl) : { id: null, type: null };

    // Only proceed if YouTube API is loaded and we have content to play
    if (newContentId && newContentType && iframeElement && window.YT && window.YT.Player) {
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
        // Player already exists, check if content needs to change
        if (currentContentIdRef.current !== newContentId) {
          if (newContentType === 'video') {
            playerRef.current.loadVideoById(newContentId);
          } else if (newContentType === 'playlist') {
            playerRef.current.loadPlaylist({ list: newContentId, listType: 'playlist' });
          }
          currentContentIdRef.current = newContentId;
        }
      } else {
        // Create new player
        const playerOptions: any = {
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
          },
        };

        if (newContentType === 'video') {
          playerOptions.videoId = newContentId;
          playerOptions.playerVars = { ...commonPlayerVars, playlist: newContentId };
        } else if (newContentType === 'playlist') {
          playerOptions.playerVars = { ...commonPlayerVars, listType: 'playlist', list: newContentId };
        }
        
        playerRef.current = new window.YT.Player(iframeElement, playerOptions);
        currentContentIdRef.current = newContentId;
      }
    } else {
      // If no content or API not ready, destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      latestState.current.setPlayerReady(false);
      latestState.current.setIsPlaying(false);
      latestState.current.setYoutubeCurrentTime(0);
      latestState.current.setYoutubeDuration(0);
      latestState.current.clearTimeUpdateInterval();
      currentContentIdRef.current = null;
    }

    return () => {
      // Cleanup for this useEffect.
      // If the component unmounts, or dependencies change such that player should be destroyed,
      // the 'else' block above handles it.
      // No need to explicitly remove window.onYouTubeIframeAPIReady here, as it's a global handler.
    };
  }, [embedUrl, iframeRef, onPlayerReady, onPlayerStateChange]); // Dependencies are correct.

  const togglePlayPause = useCallback(() => {
    const { isPlaying, playerReady } = latestState.current;
    if (playerReady && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  }, []); // Dependencies are empty

  const setVolume = useCallback((vol: number) => {
    const { playerReady, setVolumeState, setIsMuted, prevVolumeRef } = latestState.current;
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(vol);
      setVolumeState(vol);
      setIsMuted(vol === 0);
      if (vol > 0) {
        prevVolumeRef.current = vol;
      }
    }
  }, []); // Dependencies are empty

  const toggleMute = useCallback(() => {
    const { playerReady, isMuted, volume, setVolumeState, setIsMuted, prevVolumeRef } = latestState.current;
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
  }, []); // Dependencies are empty

  const seekTo = useCallback((seconds: number) => {
    const { playerReady } = latestState.current;
    if (playerReady && playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  }, []); // Dependencies are empty

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