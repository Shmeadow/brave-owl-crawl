"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LOCAL_STORAGE_SPOTIFY_EMBED_KEY = 'spotify_embed_url';

interface SpotifyEmbedDisplayProps {
  onOpenSpotifyModal: () => void;
}

export function SpotifyEmbedDisplay({ onOpenSpotifyModal }: SpotifyEmbedDisplayProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY);
      setEmbedUrl(savedUrl);
    }
  }, []);

  // Listen for changes in local storage (e.g., from the modal)
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        setEmbedUrl(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!mounted || !embedUrl) {
    return (
      <div className="spotify-panel w-full max-w-md mx-auto p-4 bg-black/30 backdrop-blur-md rounded-lg shadow-lg text-center text-white/80">
        <p className="mb-4">No Spotify player embedded. Add one to enjoy music!</p>
        <Button onClick={onOpenSpotifyModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Embed Spotify Player
        </Button>
      </div>
    );
  }

  return (
    <div className="spotify-panel w-full max-w-md mx-auto p-4 bg-black/30 backdrop-blur-md rounded-lg shadow-lg">
      <h3 className="text-md font-semibold mb-2 text-white">Now Playing:</h3>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full rounded-md shadow-xl"
        ></iframe>
      </div>
      <Button onClick={onOpenSpotifyModal} variant="outline" className="mt-4 w-full bg-white/10 text-white/80 hover:bg-white/20">
        Change Playlist
      </Button>
    </div>
  );
}