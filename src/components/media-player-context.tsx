"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ActivePlayerType = 'youtube' | 'spotify' | null;

interface MediaPlayerContextType {
  activePlayer: ActivePlayerType;
  youtubeEmbedUrl: string | null;
  spotifyEmbedUrl: string | null;
  setYoutubeEmbedUrl: (url: string | null) => void;
  setSpotifyEmbedUrl: (url: string | null) => void;
  setActivePlayer: (player: ActivePlayerType) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

const LOCAL_STORAGE_YOUTUBE_EMBED_KEY = 'youtube_embed_url';
const LOCAL_STORAGE_SPOTIFY_EMBED_KEY = 'spotify_embed_url';

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activePlayer, setActivePlayerState] = useState<ActivePlayerType>(null);
  const [youtubeEmbedUrl, setYoutubeEmbedUrlState] = useState<string | null>(null);
  const [spotifyEmbedUrl, setSpotifyEmbedUrlState] = useState<string | null>(null);

  // Load URLs from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setYoutubeEmbedUrlState(localStorage.getItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY));
      setSpotifyEmbedUrlState(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
    }
  }, []);

  // Save URLs to local storage when they change
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
        setYoutubeEmbedUrl,
        setSpotifyEmbedUrl,
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