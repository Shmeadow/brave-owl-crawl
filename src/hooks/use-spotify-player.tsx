"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => Spotify.Player;
      // Add other Spotify types if needed
    };
  }
  namespace Spotify {
    interface Player {
      addListener: (event: string, callback: (data: PlaybackState | WebPlaybackInstance) => void) => void; // Specific type for data
      connect: () => Promise<boolean>;
      disconnect: () => void;
      togglePlay: () => Promise<void>;
      setVolume: (volume: number) => Promise<void>;
      isMuted: () => boolean;
      mute: () => Promise<void>;
      unMute: () => Promise<void>;
      seek: (position_ms: number) => Promise<void>;
      getCurrentState: () => Promise<PlaybackState | null>;
      play: (options?: PlayOptions) => Promise<void>;
      // Add other methods as needed
    }

    interface PlaybackState {
      paused: boolean;
      position: number;
      duration: number;
      track_window: {
        current_track: SpotifyTrack;
        // Add other track window properties if needed
      };
      // Add other state properties if needed
    }

    interface WebPlaybackInstance {
      device_id: string;
    }

    interface PlayOptions {
      uris?: string[];
      context_uri?: string;
      offset?: { position?: number; uri?: string };
      position_ms?: number;
    }
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
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume); // To store volume before muting
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

  const updatePlaybackState = useCallback((state: Spotify.PlaybackState | null) => {
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
    setSpotifyCurrentTime(state.position / 1000);
    setSpotifyDuration(state.duration / 1000);

    if (!state.paused && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          playerRef.current.getCurrentState().then((s: Spotify.PlaybackState | null) => {
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

    player.addListener('ready', ({ device_id }: Spotify.WebPlaybackInstance) => {
      console.log('Ready with Device ID', device_id);
      deviceIdRef.current = device_id;
      setPlayerReady(true);
      toast.success("Connected to Spotify!");
    });

    player.addListener('not_ready', ({ device_id }: Spotify.WebPlaybackInstance) => {
      console.log('Device ID has gone offline', device_id);
      setPlayerReady(false);
      toast.error("Spotify device went offline.");
    });

    player.addListener('player_state_changed', updatePlaybackState);

    player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Account error:', message);
      toast.error(`Spotify Account Error: ${message}`);
    });

    player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Playback error:', message);
      toast.error(`Spotify Playback Error: ${message}`);
    });

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

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('spotify-web-playback-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-web-playback-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("Spotify Web Playback SDK is ready!");
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectFromSpotify();
    };
  }, [disconnectFromSpotify]);

  const togglePlayPause = useCallback(() => {
    if (playerReady && playerRef.current) {
      playerRef.current.togglePlay().catch((e: Error) => console.error("Error toggling play/pause:", e));
    } else {
      toast.error("Spotify player not ready. Please connect first.");
    }
  }, [playerReady]);

  const setVolume = useCallback((vol: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(vol).then(() => {
        setVolumeState(vol);
        setIsMuted(vol === 0);
      }).catch((e: Error) => console.error("Error setting volume:", e));
    }
  }, [playerReady]);

  const toggleMute = useCallback(() => {
    if (playerReady && playerRef.current) {
      playerRef.current.setVolume(isMuted ? (volume > 0 ? volume : 0.5) : 0).then(() => {
        setIsMuted(!isMuted);
        setVolumeState(isMuted ? (volume > 0 ? volume : 0.5) : 0);
      }).catch((e: Error) => console.error("Error toggling mute:", e));
    }
  }, [playerReady, isMuted, volume]);

  const seekTo = useCallback((seconds: number) => {
    if (playerReady && playerRef.current) {
      playerRef.current.seek(seconds * 1000).catch((e: Error) => console.error("Error seeking:", e));
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
          play: true,
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