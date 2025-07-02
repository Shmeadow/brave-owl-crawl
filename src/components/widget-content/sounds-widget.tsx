"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Settings, Music, Link, Youtube } from "lucide-react";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { YoutubeEmbedModal } from "@/components/youtube-embed-modal"; // Import the new modal
import { Slider } from "@/components/ui/slider";

const LOCAL_STORAGE_SPOTIFY_EMBED_KEY = 'spotify_embed_url';
const LOCAL_STORAGE_YOUTUBE_EMBED_KEY = 'youtube_embed_url'; // New local storage key

export function SoundsWidget() {
  // Removed useMusicPlayer hook as it's no longer needed for the main player bar

  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false); // New state for YouTube modal
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(null);
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null); // New state for YouTube embed

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpotifyEmbedUrl(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
      setYoutubeEmbedUrl(localStorage.getItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY)); // Load YouTube URL
    }
  }, [isSpotifyModalOpen, isYoutubeModalOpen]); // Re-check when either modal closes

  const handleSpotifyModalClose = () => {
    setIsSpotifyModalOpen(false);
    setSpotifyEmbedUrl(localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY));
  };

  const handleYoutubeModalClose = () => { // New handler for YouTube modal
    setIsYoutubeModalOpen(false);
    setYoutubeEmbedUrl(localStorage.getItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Sounds & Music</h1>

        <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-500" /> Main Music Player (YouTube)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              The main music player bar (top-right) now streams YouTube videos.
              Embed a YouTube video directly into your space.
              Paste a standard YouTube video URL, and it will be converted for embedding.
            </p>
            <Button onClick={() => setIsYoutubeModalOpen(true)} className="w-full">
              <Settings className="mr-2 h-4 w-4" /> Manage YouTube Embed
            </Button>
            {youtubeEmbedUrl ? (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Currently Embedded:</h3>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                  <iframe
                    src={youtubeEmbedUrl}
                    width="100%"
                    height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="absolute top-0 left-0 w-full h-full rounded-md"
                  ></iframe>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No YouTube video embedded in the main player. Click "Manage YouTube Embed" to add one.
              </p>
            )}
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
        <YoutubeEmbedModal isOpen={isYoutubeModalOpen} onClose={handleYoutubeModalClose} />
      </div>
    </div>
  );
}