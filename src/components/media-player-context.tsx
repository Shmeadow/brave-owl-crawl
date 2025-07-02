"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ActivePlayerType = 'youtube' | 'spotify' | 'local-audio' | null;

export interface Track {
  src: string;
  title: string;
  artist: string;
  cover: string;
}

interface MediaPlayerContextType {
  activePlayer: ActivePlayerType;
  youtubeEmbedUrl: string | null;
  spotifyEmbedUrl: string | null;
  localAudioPlaylist: Track[] | null;
  currentLocalAudioIndex: number;
  setYoutubeEmbedUrl: (url: string | null) => void;
  setSpotifyEmbedUrl: (url: string | null) => void;
  setLocalAudioPlaylist: (playlist: Track[] | null) => void;
  setCurrentLocalAudioIndex: (index: number) => void;
  setActivePlayer: (player: ActivePlayerType) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

const LOCAL_STORAGE_YOUTUBE_EMBED_KEY = 'youtube_embed_url';
const LOCAL_STORAGE_SPOTIFY_EMBED_KEY = 'spotify_embed_url';
const LOCAL_STORAGE_LOCAL_AUDIO_PLAYLIST_KEY = 'local_audio_playlist';
const LOCAL_STORAGE_CURRENT_LOCAL_AUDIO_INDEX_KEY = 'current_local_audio_index';

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activePlayer, setActivePlayerState] = useState<ActivePlayerType>(null);
  const [youtubeEmbedUrl, setYoutubeEmbedUrlState] = useState<string | null>(null);
  const [spotifyEmbedUrl, setSpotifyEmbedUrlState] = useState<string | null>(null);
  const [localAudioPlaylist, setLocalAudioPlaylistState] = useState<Track[] | null>(null);
  const [currentLocalAudioIndex, setCurrentLocalAudioIndexState] = useState(0);

  // Load URLs and local audio state from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setYoutubeEmbedUrlState(localStorage.getItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY));
      setSpotifyEmbedUrlState(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
      
      const savedPlaylist = localStorage.getItem(LOCAL_STORAGE_LOCAL_AUDIO_PLAYLIST_KEY);
      if (savedPlaylist) {
        try {
          setLocalAudioPlaylistState(JSON.parse(savedPlaylist));
        } catch (e) {
          console.error("Error parsing local audio playlist from local storage:", e);
          setLocalAudioPlaylistState(null);
        }
      }

      const savedIndex = localStorage.getItem(LOCAL_STORAGE_CURRENT_LOCAL_AUDIO_INDEX_KEY);
      if (savedIndex !== null) {
        setCurrentLocalAudioIndexState(parseInt(savedIndex, 10));
      }
    }
  }, []);

  // Save URLs and local audio state to local storage when they change
  const setYoutubeEmbedUrl = useCallback((url: string | null) => {
    setYoutubeEmbedUrlState(url);
    if (typeof window !== 'undefined') {
      if (url) {
        localStorage.setItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY, url);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY);
      }
    }
  }, []);

  const setSpotifyEmbedUrl = useCallback((url: string | null) => {
    setSpotifyEmbedUrlState(url);
    if (typeof window !== 'undefined') {
      if (url) {
        localStorage.setItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY, url);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY);
      }
    }
  }, []);

  const setLocalAudioPlaylist = useCallback((playlist: Track[] | null) => {
    setLocalAudioPlaylistState(playlist);
    if (typeof window !== 'undefined') {
      if (playlist) {
        localStorage.setItem(LOCAL_STORAGE_LOCAL_AUDIO_PLAYLIST_KEY, JSON.stringify(playlist));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_LOCAL_AUDIO_PLAYLIST_KEY);
      }
    }
  }, []);

  const setCurrentLocalAudioIndex = useCallback((index: number) => {
    setCurrentLocalAudioIndexState(index);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_LOCAL_AUDIO_INDEX_KEY, String(index));
    }
  }, []);

  // Logic to ensure only one player is "active" at a time
  const setActivePlayer = useCallback((player: ActivePlayerType) => {
    setActivePlayerState(player);
  }, []);

  return (
    <MediaPlayerContext.Provider
      value={{
        activePlayer,
        youtubeEmbedUrl,
        spotifyEmbedUrl,
        localAudioPlaylist,
        currentLocalAudioIndex,
        setYoutubeEmbedUrl,
        setSpotifyEmbedUrl,
        setLocalAudioPlaylist,
        setCurrentLocalAudioIndex,
        setActivePlayer,
      }}
    >
      {children}
    </MediaPlayerContext.Provider>
  );
}

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (context === undefined) {
    throw new Error('useMediaPlayer must be used within a MediaPlayerProvider');
  }
  return context;
};