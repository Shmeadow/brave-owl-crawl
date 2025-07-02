"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Declare YT globally for TypeScript
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const LOCAL_STORAGE_YOUTUBE_EMBED_KEY = 'youtube_embed_url';

export function useYouTubePlayer(initialYoutubeEmbedUrl: string | null) {
  const [player, setPlayer] = useState<any | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50); // Default volume
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Loading video...");
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract video ID from embed URL
  const getVideoId = useCallback((url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }, []);

  const videoId = getVideoId(initialYoutubeEmbedUrl);

  // Load YouTube IFrame Player API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      if (videoId && iframeContainerRef.current) {
        const newPlayer = new window.YT.Player(iframeContainerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 1, // Autoplay the video
            controls: 0, // Hide player controls
            disablekb: 1, // Disable keyboard controls
            fs: 0, // Disable fullscreen button
            iv_load_policy: 3, // Hide video annotations
            modestbranding: 1, // Hide YouTube logo
            rel: 0, // Do not show related videos
            showinfo: 0, // Hide video title and uploader info
            loop: 1, // Loop the video
            playlist: videoId, // Required for looping
            mute: 0, // Start unmuted
            enablejsapi: 1, // Enable JS API
            origin: window.location.origin, // Important for security
            widget_referrer: window.location.href, // For analytics
            playsinline: 1, // For iOS
            // vq: 'hd1080' // Request HD quality, though YouTube decides final quality
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError,
          },
        });
        setPlayer(newPlayer);
      }
    };

    // If API is already loaded, and player hasn't been initialized yet
    if (window.YT && window.YT.Player && !player && videoId && iframeContainerRef.current) {
      window.onYouTubeIframeAPIReady();
    }

    return () => {
      if (player) {
        player.destroy();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Clean up global callback if this is the only player
      if (window.onYouTubeIframeAPIReady === window.onYouTubeIframeAPIReady) { // Simple check
        // window.onYouTubeIframeAPIReady = undefined; // Don't unset if other players might use it
      }
    };
  }, [videoId]); // Re-initialize player if videoId changes

  // Update player when initialYoutubeEmbedUrl changes
  useEffect(() => {
    const newVideoId = getVideoId(initialYoutubeEmbedUrl);
    if (player && playerReady && newVideoId && newVideoId !== player.getVideoData().video_id) {
      player.loadVideoById(newVideoId);
      setVideoTitle("Loading video..."); // Reset title
    } else if (!newVideoId && player) {
      player.destroy(); // Destroy player if no URL
      setPlayer(null);
      setPlayerReady(false);
      setIsPlaying(false);
      setVideoTitle("No video loaded");
      setCurrentTime(0);
      setDuration(0);
    }
  }, [initialYoutubeEmbedUrl, player, playerReady, getVideoId]);

  const onPlayerReady = (event: any) => {
    setPlayerReady(true);
    event.target.playVideo();
    setVolumeState(event.target.getVolume());
    setDuration(event.target.getDuration());
    setVideoTitle(event.target.getVideoData().title || "Unknown Title");
    setIsPlaying(true); // Assume playing on ready
    startProgressInterval(event.target);
  };

  const onPlayerStateChange = (event: any) => {
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
      // If loop is enabled, it will restart automatically
      // If not, you might want to reset state or load next video
      setCurrentTime(0);
    }
  };

  const onPlayerError = (event: any) => {
    console.error("YouTube Player Error:", event.data);
    // Handle specific error codes if needed
    setVideoTitle("Error loading video");
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startProgressInterval = (playerInstance: any) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (playerInstance && typeof playerInstance.getCurrentTime === 'function') {
        setCurrentTime(playerInstance.getCurrentTime());
      }
    }, 1000); // Update every second
  };

  const togglePlayPause = useCallback(() => {
    if (playerReady && player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  }, [player, playerReady, isPlaying]);

  const setVolume = useCallback((newVolume: number) => {
    if (playerReady && player) {
      player.setVolume(newVolume);
      setVolumeState(newVolume);
    }
  }, [player, playerReady]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

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
    iframeContainerRef, // Pass ref to the component
  };
}