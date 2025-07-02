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
    currentTime,
    duration,
    videoTitle,
    formatTime,
    iframeContainerRef, // Use the ref from the hook
  } = useYouTubePlayer(youtubeEmbedUrl);

  if (!youtubeEmbedUrl) {
    return null; // Don't render if no YouTube URL is set
  }

  return (
    <Card
      className={cn(
        "fixed top-20 right-4 z-[1000]", // Positioned top-right, below header
        "w-80 h-32", // Adjusted fixed width and height to accommodate text
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg", // Glass effect
        "flex flex-col justify-between px-4 py-2 transition-all duration-300 ease-in-out"
      )}
    >
      {/* YouTube Player Iframe Container (hidden but active) */}
      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
        <div
          ref={iframeContainerRef} // Attach the ref here
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[100vw] min-h-[100vh] max-w-none max-h-none"
          style={{ transform: 'scale(2)' }} // Zoom in to hide controls and branding
        >
          {/* The YouTube API will inject the iframe here */}
        </div>
      </div>

      {/* Content Overlay */}
      <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
        {/* Video Title and Time */}
        <div className="flex flex-col text-sm text-foreground">
          <span className="font-semibold truncate">{videoTitle}</span>
          <span className="text-xs text-muted-foreground">
            {playerReady ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "0:00 / 0:00"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full mt-2">
          <Button
            onClick={togglePlayPause}
            disabled={!playerReady}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
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