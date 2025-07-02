"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Youtube, Music, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useMediaPlayer } from '@/components/media-player-context';
import { toast } from "sonner";

export function MediaPlayerBar() {
  const {
    activePlayer,
    youtubeEmbedUrl,
    spotifyEmbedUrl,
    setYoutubeEmbedUrl,
    setSpotifyEmbedUrl,
    setActivePlayer,
  } = useMediaPlayer();

  const {
    isPlaying: isYouTubePlaying,
    volume: youtubeVolume,
    isMuted: isYouTubeMuted,
    togglePlayPause: toggleYouTubePlayPause,
    setVolume: setYouTubeVolume,
    toggleMute: toggleYouTubeMute,
    playerReady: youTubePlayerReady,
    currentTime: youtubeCurrentTime,
    duration: youtubeDuration,
    videoTitle: youtubeVideoTitle,
    formatTime: formatYouTubeTime,
    iframeContainerRef: youtubeIframeContainerRef,
  } = useYouTubePlayer(youtubeEmbedUrl);

  // Determine if the bar should be visible at all
  const isBarVisible = youtubeEmbedUrl !== null || spotifyEmbedUrl !== null;

  if (!isBarVisible) {
    return null;
  }

  const handleClearEmbed = () => {
    if (activePlayer === 'youtube') {
      setYoutubeEmbedUrl(null);
      toast.info("YouTube embed removed.");
    } else if (activePlayer === 'spotify') {
      setSpotifyEmbedUrl(null);
      toast.info("Spotify embed removed.");
    }
    setActivePlayer(null);
  };

  return (
    <Card
      className={cn(
        "fixed top-20 right-4 z-[1000]",
        "w-80 h-auto", // Auto height to adjust to content
        "bg-card backdrop-blur-xl border-white/20 shadow-lg rounded-lg", // Removed /40
        "flex flex-col px-4 py-2 transition-all duration-300 ease-in-out",
        activePlayer === 'spotify' ? 'border-primary' : 'border-transparent' // Highlight if Spotify is active
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold text-foreground">Media Player</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearEmbed} title="Remove Current Embed">
          <X className="h-4 w-4" />
          <span className="sr-only">Remove Current Embed</span>
        </Button>
      </div>

      {/* Player Selector */}
      <div className="flex gap-2 mb-4">
        {youtubeEmbedUrl && (
          <Button
            variant={activePlayer === 'youtube' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePlayer('youtube')}
            className="flex-1"
          >
            <Youtube className="h-4 w-4 mr-1" /> YouTube
          </Button>
        )}
        {spotifyEmbedUrl && (
          <Button
            variant={activePlayer === 'spotify' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePlayer('spotify')}
            className="flex-1"
          >
            <Music className="h-4 w-4 mr-1" /> Spotify
          </Button>
        )}
      </div>

      {/* Conditional Player Rendering */}
      {activePlayer === 'youtube' && youtubeEmbedUrl && (
        <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
          {/* YouTube Player Iframe Container (hidden but active) */}
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div
              ref={youtubeIframeContainerRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[100vw] min-h-[100vh] max-w-none max-h-none"
              style={{ transform: 'scale(2)' }} // Zoom in to hide controls and branding
            >
              {/* The YouTube API will inject the iframe here */}
            </div>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex flex-col text-sm text-foreground">
            <span className="font-semibold truncate">{youtubeVideoTitle}</span>
            <span className="text-xs text-muted-foreground">
              {youTubePlayerReady ? `${formatYouTubeTime(youtubeCurrentTime)} / ${formatYouTubeTime(youtubeDuration)}` : "0:00 / 0:00"}
            </span>
          </div>

          <div className="flex items-center gap-4 w-full mt-2">
            <Button
              onClick={toggleYouTubePlayPause}
              disabled={!youTubePlayerReady}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              {isYouTubePlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Button
                onClick={toggleYouTubeMute}
                disabled={!youTubePlayerReady}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                {isYouTubeMuted || youtubeVolume === 0 ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5 text-muted-foreground" />}
                <span className="sr-only">{isYouTubeMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Slider
                value={[youtubeVolume]}
                max={100}
                step={1}
                onValueChange={([val]) => setYouTubeVolume(val)}
                disabled={!youTubePlayerReady}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      )}

      {activePlayer === 'spotify' && spotifyEmbedUrl && (
        <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height="100%"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full rounded-md"
              title="Spotify Player"
            ></iframe>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            (Use controls within the player for playback and volume)
          </p>
        </CardContent>
      )}

      {!activePlayer && (youtubeEmbedUrl || spotifyEmbedUrl) && (
        <CardContent className="text-center text-muted-foreground text-sm p-0">
          Select a player above to activate.
        </CardContent>
      )}
    </Card>
  );
}