"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Declare global Spotify object for TypeScript
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify: any; // Spotify Web Playback SDK object
  }
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    uri: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  uri: string;
}

interface UseSpotifyPlayerResult {
  playerReady: boolean;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTrack: SpotifyTrack | null;
  spotifyCurrentTime: number;
  spotifyDuration: number;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
  connectToSpotify: () => void;
  disconnectFromSpotify: () => void;
  transferPlayback: (deviceId: string) => void;
  playTrack: (trackUri: string) => void;
}

export function useSpotifyPlayer(accessToken: string | null): UseSpotifyPlayerResult {
  const playerRef = useRef<any>(null); // Spotify.Player instance
  const deviceIdRef = useRef<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5); // 0-1 range
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyCurrentTime, setSpotifyCurrentTime] = useState(0);
  const [spotifyDuration, setSpotifyDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeUpdateInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updatePlaybackState = useCallback((state: any) => {
    if (!state) {
      setIsPlaying(false);
      setCurrentTrack(null);
      setSpotifyCurrentTime(0);
      setSpotifyDuration(0);
      clearTimeUpdateInterval();
      return;
    }

    setIsPlaying(!state.paused);
    setCurrentTrack(state.track_window.current_track);
    setSpotifyCurrentTime(state.position / 1000); // Convert ms to seconds
    setSpotifyDuration(state.duration / 1000); // Convert ms to seconds

    if (!state.paused && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          playerRef.current.getCurrentState().then((s: any) => {
            if (s) setSpotifyCurrentTime(s.position / 1000);
          });
        }
      }, 1000);
    } else if (state.paused && intervalRef.current) {
      clearTimeUpdateInterval();
    }
  }, [clearTimeUpdateInterval]);

  const connectToSpotify = useCallback(() => {
    if (!accessToken) {
      toast.error("Spotify access token is missing. Please log in to Spotify.");
      return;
    }

    if (playerRef.current) {
      playerRef.current.connect();
      return;
    }

    if (typeof window.Spotify === 'undefined') {
      toast.error("Spotify Web Playback SDK not loaded.");
      return;
    }

    const player = new window.Spotify.Player({
      name: 'Productivity Hub Player',
      getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
      volume: volume,
    });

    // Ready
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      deviceIdRef.current = device_id;
      setPlayerReady(true);
      toast.success("Connected to Spotify!");
      // Optionally transfer playback to this device immediately
      // transferPlayback(device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
      setPlayerReady(false);
      toast.error("Spotify device went offline.");
    });

    // Player State Changed
    player.addListener('player_state_changed', updatePlaybackState);

    // Account Error
    player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Account error:', message);
      toast.error(`Spotify Account Error: ${message}`);
    });

    // Playback Error
    player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Playback error:', message);
      toast.error(`Spotify Playback Error: ${message}`);
    });

    // Autoplay Failed
    player.addListener('autoplay_failed', () => {
      console.warn('Autoplay is not allowed by the browser.');
      toast.info("Autoplay blocked. Please click play manually.");
    });

    player.connect();
    playerRef.current = player;
  }, [accessToken, volume, updatePlaybackState]);

  const disconnectFromSpotify = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
      setPlayerReady(false);
      setIsPlaying(false);
      setCurrentTrack(null);
      setSpotifyCurrentTime(0);
      setSpotifyDuration(0);
      clearTimeUpdateInterval();
      toast.info("Disconnected from Spotify.");
    }
  }, [clearTimeUpdateInterval]);

  // Load Spotify Web Playback SDK script
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('spotify-web-playback-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-web-playback-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("Spotify Web Playback SDK is ready!");
        // The connectToSpotify function will be called manually by the user
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromSpotify();
    };
  }, [disconnectFromSpotify]);

  const togglePlayPause = useCallback(() => {
    if (playerReady && playerRef.current) {
      playerRef.current.togglePlay().catch((e: any) => console.error("Error toggling play/pause:", e));
    } else {
      toast.error("Spotify player not ready. Please connect first.");
    }
  }, [playerReady]);

  const setVolume = useCallback((vol: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(vol).then(() => {
        setVolumeState(vol);
        setIsMuted(vol === 0);
      }).catch((e: any) => console.error("Error setting volume:", e));
    }
  }, [playerReady]);

  const toggleMute = useCallback(() => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(isMuted ? (volume > 0 ? volume : 0.5) : 0).then(() => {
        setIsMuted(!isMuted);
        setVolumeState(isMuted ? (volume > 0 ? volume : 0.5) : 0);
      }).catch((e: any) => console.error("Error toggling mute:", e));
    }
  }, [playerReady, isMuted, volume]);

  const seekTo = useCallback((seconds: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.seek(seconds * 1000).catch((e: any) => console.error("Error seeking:", e));
    }
  }, [playerReady]);

  const transferPlayback = useCallback(async (deviceId: string) => {
    if (!accessToken) {
      toast.error("Access token required to transfer playback.");
      return;
    }
    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: true, // Start playback on the new device
        }),
      });
      console.log("Playback transferred to new device:", deviceId);
    } catch (error) {
      console.error("Error transferring playback:", error);
      toast.error("Failed to transfer Spotify playback.");
    }
  }, [accessToken]);

  const playTrack = useCallback(async (trackUri: string) => {
    if (!accessToken || !deviceIdRef.current) {
      toast.error("Spotify not connected or device not ready.");
      return;
    }
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ uris: [trackUri] }),
      });
      toast.success("Playing Spotify track!");
    } catch (error) {
      console.error("Error playing track:", error);
      toast.error("Failed to play Spotify track.");
    }
  }, [accessToken]);

  return {
    playerReady,
    isPlaying,
    volume,
    isMuted,
    currentTrack,
    spotifyCurrentTime,
    spotifyDuration,
    togglePlayPause,
    setVolume,
    toggleMute,
    seekTo,
    connectToSpotify,
    disconnectFromSpotify,
    transferPlayback,
    playTrack,
  };
}