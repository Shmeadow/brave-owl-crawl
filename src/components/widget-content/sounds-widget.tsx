"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Settings, Music, Link } from "lucide-react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { Slider } from "@/components/ui/slider";

const LOCAL_STORAGE_SPOTIFY_EMBED_KEY = 'spotify_embed_url';

export function SoundsWidget() {
  // Lofi audio controls are now handled by MusicPlayerBar, so we don't need them here.
  // We still use useMusicPlayer to get the current state for display purposes if needed,
  // but the direct control buttons are removed from this widget.
  const {
    isPlaying,
    volume,
    isMuted,
    togglePlayPause, // Still available if we wanted to add buttons here, but we won't for simplicity
    setVolume,
    toggleMute,
  } = useMusicPlayer();

  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpotifyEmbedUrl(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
    }
  }, [isSpotifyModalOpen]); // Re-check when modal closes

  const handleSpotifyModalClose = () => {
    setIsSpotifyModalOpen(false);
    // Re-fetch the URL after modal closes to update the iframe
    setSpotifyEmbedUrl(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Sounds & Music</h1>

        <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-6 w-6" /> Lofi Chill Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Control the site-wide Lofi Chill background music using the player bar at the bottom right of your screen.
            </p>
            {/* Removed direct play/pause/volume controls from here as they are in MusicPlayerBar */}
          </CardContent>
        </Card>

        <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-6 w-6" /> Spotify Embed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Embed your favorite Spotify playlists, tracks, or albums directly into your space.
              Paste a standard Spotify URL, and it will be converted for embedding.
            </p>
            <Button onClick={() => setIsSpotifyModalOpen(true)} className="w-full">
              <Settings className="mr-2 h-4 w-4" /> Manage Spotify Embed
            </Button>
            {spotifyEmbedUrl ? (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Currently Embedded:</h3>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                  <iframe
                    src={spotifyEmbedUrl}
                    width="100%"
                    height="100%"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="absolute top-0 left-0 w-full h-full rounded-md"
                  ></iframe>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No Spotify player embedded. Click "Manage Spotify Embed" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={handleSpotifyModalClose} />
      </div>
    </div>
  );
}