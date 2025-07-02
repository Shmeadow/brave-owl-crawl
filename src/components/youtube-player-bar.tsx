"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

interface YouTubePlayerBarProps {
  youtubeEmbedUrl: string | null;
}

export function YouTubePlayerBar({ youtubeEmbedUrl }: YouTubePlayerBarProps) {
  const {
    isPlaying,
    volume,
    togglePlayPause,
    setVolume,
    playerReady,
    iframeId,
  } = useYouTubePlayer(youtubeEmbedUrl);

  if (!youtubeEmbedUrl) {
    return null; // Don't render if no YouTube URL is set
  }

  return (
    <Card
      className={cn(
        "fixed top-20 right-4 z-[1000]", // Positioned top-right, below header
        "w-64 h-24", // Adjusted fixed width and height
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg", // Glass effect
        "flex items-center justify-between px-4 py-2 transition-all duration-300 ease-in-out"
      )}
    >
      <CardContent className="flex items-center gap-4 p-0 w-full">
        {/* YouTube Player Iframe (hidden but active) */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <iframe
            id={iframeId}
            src={youtubeEmbedUrl}
            width="100%"
            height="100%"
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[100vw] min-h-[100vh] max-w-none max-h-none" // Make it cover the entire screen
            style={{ transform: 'scale(2)' }} // Zoom in to hide controls and branding
            title="YouTube Background Player"
          ></iframe>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center gap-4 w-full">
          <Button
            onClick={togglePlayPause}
            disabled={!playerReady}
            size="icon"
            className="h-10 w-10"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 flex-1">
            {volume === 0 ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5 text-muted-foreground" />}
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={([val]) => setVolume(val)}
              disabled={!playerReady}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}