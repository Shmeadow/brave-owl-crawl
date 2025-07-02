"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, VolumeX, Volume2, Music, SkipForward, SkipBack } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";

export function MusicPlayerBar() {
  const {
    isPlaying,
    volume,
    isMuted,
    currentTrack,
    togglePlayPause,
    setVolume,
    toggleMute,
    playNextTrack,
    playPreviousTrack,
  } = useMusicPlayer();

  // The bar will always be "full" now, no compact state or pinning
  const progressValue = currentTrack && currentTrack.duration > 0
    ? (currentTrack.currentTime / currentTrack.duration) * 100
    : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "fixed top-16 right-4 z-30 transition-all duration-300 ease-in-out", // Positioned top-right, below header
        "w-64" // Always full width
      )}
    >
      <Card
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
          "h-auto p-3" // Always full height and padding
        )}
      >
        <CardContent className="flex flex-col gap-2 p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">
                {currentTrack?.name || "Lofi Chill"}
                {currentTrack && currentTrack.total > 1 && ` (${currentTrack.index + 1}/${currentTrack.total})`}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={(val) => setVolume(val[0])}
              className="flex-1"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={playPreviousTrack}>
              <SkipBack className="h-4 w-4" />
              <span className="sr-only">Previous Track</span>
            </Button>
            <span className="text-xs text-muted-foreground">{formatTime(currentTrack?.currentTime || 0)}</span>
            <Progress value={progressValue} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground">{formatTime(currentTrack?.duration || 0)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={playNextTrack}>
              <SkipForward className="h-4 w-4" />
              <span className="sr-only">Next Track</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}