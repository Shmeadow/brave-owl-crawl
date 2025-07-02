"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: {
      Player: new (element: HTMLElement | string, options: YT.PlayerOptions) => YT.Player;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
        UNSTARTED: number;
      };
    };
  }
  namespace YT {
    interface Player {
      playVideo: () => void;
      pauseVideo: () => void;
      seekTo: (seconds: number, allowSeekAhead: boolean) => void;
      setVolume: (volume: number) => void;
      getVolume: () => number;
      isMuted: () => boolean;
      mute: () => void;
      unMute: () => void;
      getPlayerState: () => number;
      getDuration: () => number;
      getCurrentTime: () => number;
      loadVideoById: (videoId: string, startSeconds?: number, suggestedQuality?: string) => void;
      destroy: () => void;
      // Add other methods as needed
    }
    interface PlayerOptions {
      videoId?: string;
      playerVars?: { [key: string]: any };
      events?: {
        onReady?: (event: { target: YT.Player }) => void;
        onStateChange?: (event: { data: number; target: YT.Player }) => void;
        // Add other events as needed
      };
    }
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
  const playerRef = useRef<YT.Player | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(50);
  const [playerReady, setPlayerReady] = useState(false);
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);

  const clearTimeUpdateInterval = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  const onPlayerReady = useCallback((event: { target: YT.Player }) => {
    console.log("YouTube Player Ready:", event.target);
    setPlayerReady(true);
    event.target.setVolume(volume);
    setIsPlaying(event.target.getPlayerState() === window.YT.PlayerState.PLAYING);
    setIsMuted(event.target.isMuted());
    setYoutubeDuration(event.target.getDuration());
    setYoutubeCurrentTime(event.target.getCurrentTime());
    
    if (event.target.getPlayerState() !== window.YT.PlayerState.PLAYING) {
      event.target.playVideo();
    }

    clearTimeUpdateInterval();
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setYoutubeCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  }, [volume, clearTimeUpdateInterval]);

  const onPlayerStateChange = useCallback((event: { data: number; target: YT.Player }) => {
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

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "youtube-iframe-api-script";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    const newVideoIdMatch = embedUrl?.match(/\/embed\/([\w-]+)/);
    const newVideoId = newVideoIdMatch ? newVideoIdMatch[1] : null;

    const currentIframe = iframeRef.current;

    const createOrUpdatePlayer = () => {
      if (!newVideoId || !currentIframe || !window.YT || !window.YT.Player) {
        console.log("YouTube API or iframe not ready for player creation/update.");
        return;
      }

      if (playerRef.current) {
        if (currentVideoIdRef.current === newVideoId) {
          console.log("YouTube player exists, same video. Ensuring state.");
          if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
            playerRef.current.playVideo();
          }
        } else {
          console.log("YouTube player exists, loading new video:", newVideoId);
          playerRef.current.loadVideoById(newVideoId);
          playerRef.current.setVolume(volume);
          playerRef.current.unMute();
          setIsMuted(false);
          setIsPlaying(true);
          currentVideoIdRef.current = newVideoId;
        }
      } else {
        console.log("Creating new YouTube player for video:", newVideoId);
        playerRef.current = new window.YT.Player(currentIframe, {
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

    if (newVideoId && currentIframe) {
      if (window.YT && window.YT.Player) {
        createOrUpdatePlayer();
      } else {
        window.onYouTubeIframeAPIReady = createOrUpdatePlayer;
      }
    } else {
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

    return () => {
      if (!newVideoId || !currentIframe) {
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