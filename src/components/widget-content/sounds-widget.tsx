"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Link, Youtube, Music, ListMusic } from "lucide-react";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { YoutubeEmbedModal } from "@/components/youtube-embed-modal";
import { useMediaPlayer, Track } from '@/components/media-player-context';
import { toast } from "sonner";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Define a default local audio playlist
const DEFAULT_LOCAL_PLAYLIST: Track[] = [
  {
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    title: "SoundHelix Song 1",
    artist: "SoundHelix",
    cover: "https://via.placeholder.com/150/FF5733/FFFFFF?text=Track1",
  },
  {
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    title: "SoundHelix Song 2",
    artist: "SoundHelix",
    cover: "https://via.placeholder.com/150/33FF57/FFFFFF?text=Track2",
  },
  {
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    title: "SoundHelix Song 3",
    artist: "SoundHelix",
    cover: "https://via.placeholder.com/150/3357FF/FFFFFF?text=Track3",
  },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const {
    youtubeEmbedUrl,
    spotifyEmbedUrl,
    localAudioPlaylist,
    setYoutubeEmbedUrl,
    setSpotifyEmbedUrl,
    setLocalAudioPlaylist,
    setActivePlayer
  } = useMediaPlayer();

  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);

  const handleSpotifyModalClose = () => {
    setIsSpotifyModalOpen(false);
  };

  const handleYoutubeModalClose = () => {
    setIsYoutubeModalOpen(false);
  };

  const handleLoadDefaultPlaylist = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to load local audio in this room.");
      return;
    }
    setLocalAudioPlaylist(DEFAULT_LOCAL_PLAYLIST);
    setActivePlayer('local-audio');
    toast.success("Default local audio playlist loaded!");
  };

  const handleClearLocalPlaylist = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to clear local audio in this room.");
      return;
    }
    setLocalAudioPlaylist(null);
    if (activePlayer === 'local-audio') {
      setActivePlayer(null);
    }
    toast.info("Local audio playlist cleared.");
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Sounds & Music</h1>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
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
            <Button onClick={() => setIsYoutubeModalOpen(true)} className="w-full" disabled={!isCurrentRoomWritable}>
              <Settings className="mr-2 h-4 w-4" /> Manage YouTube Embed
            </Button>

            {youtubeEmbedUrl ? (
              <p className="text-sm text-muted-foreground text-center mt-4">
                A YouTube video is currently embedded. It will appear in the media player bar.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No YouTube video embedded. Click "Manage YouTube Embed" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
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
            <Button onClick={() => setIsSpotifyModalOpen(true)} className="w-full" disabled={!isCurrentRoomWritable}>
              <Settings className="mr-2 h-4 w-4" /> Manage Spotify Embed
            </Button>
            {spotifyEmbedUrl ? (
              <p className="text-sm text-muted-foreground text-center mt-4">
                A Spotify player is currently embedded. It will appear in the media player bar.
                **Please use the controls directly within the Spotify player.**
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No Spotify player embedded. Click "Manage Spotify Embed" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="h-6 w-6" /> Local Audio Player
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Play pre-defined local audio tracks.
            </p>
            <Button onClick={handleLoadDefaultPlaylist} className="w-full" disabled={!isCurrentRoomWritable}>
              Load Default Playlist
            </Button>
            {localAudioPlaylist && localAudioPlaylist.length > 0 ? (
              <Button onClick={handleClearLocalPlaylist} variant="outline" className="w-full" disabled={!isCurrentRoomWritable}>
                Clear Local Playlist
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center mt-2">
                No local audio playlist loaded.
              </p>
            )}
          </CardContent>
        </Card>

        <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={handleSpotifyModalClose} isCurrentRoomWritable={isCurrentRoomWritable} />
        <YoutubeEmbedModal isOpen={isYoutubeModalOpen} onClose={handleYoutubeModalClose} isCurrentRoomWritable={isCurrentRoomWritable} />
      </div>
    </div>
  );
}