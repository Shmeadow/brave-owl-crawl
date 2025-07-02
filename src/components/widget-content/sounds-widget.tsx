"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Link, Youtube } from "lucide-react";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { YoutubeEmbedModal } from "@/components/youtube-embed-modal";
import { useMediaPlayer } from '@/components/media-player-context'; // Import useMediaPlayer

export function SoundsWidget() {
  const { youtubeEmbedUrl, spotifyEmbedUrl, setYoutubeEmbedUrl, setSpotifyEmbedUrl, setActivePlayer } = useMediaPlayer();
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);

  const handleSpotifyModalClose = () => {
    setIsSpotifyModalOpen(false);
    // The context's setSpotifyEmbedUrl already updates local storage
  };

  const handleYoutubeModalClose = () => {
    setIsYoutubeModalOpen(false);
    // The context's setYoutubeEmbedUrl already updates local storage
  };

  const handleActivateSpotify = () => {
    if (spotifyEmbedUrl) {
      setActivePlayer('spotify');
    }
  };

  const handleActivateYoutube = () => {
    if (youtubeEmbedUrl) {
      setActivePlayer('youtube');
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Sounds & Music</h1>

        <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-500" /> YouTube Background Player
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Embed a YouTube video to play as background music.
              Paste a standard YouTube video URL, and it will be converted for embedding.
            </p>
            <Button onClick={() => setIsYoutubeModalOpen(true)} className="w-full">
              <Settings className="mr-2 h-4 w-4" /> Manage YouTube Embed
            </Button>

            {youtubeEmbedUrl ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground text-center">
                  A YouTube video is currently embedded and playing in the background bar.
                </p>
                <Button onClick={handleActivateYoutube} className="w-full" variant="secondary">
                  Activate YouTube Player
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No YouTube video embedded. Click "Manage YouTube Embed" to add one.
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
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground text-center">
                  A Spotify player is currently embedded.
                </p>
                <Button onClick={handleActivateSpotify} className="w-full" variant="secondary">
                  Activate Spotify Player
                </Button>
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