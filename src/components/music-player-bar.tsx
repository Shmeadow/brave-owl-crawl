"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, VolumeX, Volume2, Pin, PinOff, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";

const LOCAL_STORAGE_MUSIC_BAR_PINNED_KEY = 'music_player_bar_pinned';

export function MusicPlayerBar() {
  const {
    isPlaying,
    volume,
    isMuted,
    currentTrack,
    togglePlayPause,
    setVolume,
    toggleMute,
  } = useMusicPlayer();

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_MUSIC_BAR_PINNED_KEY) === 'true';
    }
    return false;
  });
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_MUSIC_BAR_PINNED_KEY, String(isPinned));
    }
  }, [isPinned]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // Small delay before hiding
  };

  const togglePin = () => {
    setIsPinned(prev => !prev);
  };

  const showFullBar = isPinned || isHovered || isPlaying; // Show full bar if pinned, hovered, or playing

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
        "fixed right-4 z-50 transition-all duration-300 ease-in-out",
        "bottom-4", // Position at bottom right
        showFullBar ? "w-64" : "w-14 h-14", // Expanded or compact size
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
          showFullBar ? "h-auto p-3" : "h-14 w-14 flex items-center justify-center p-0",
          "transition-all duration-300 ease-in-out"
        )}
      >
        {showFullBar ? (
          <CardContent className="flex flex-col gap-2 p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Lofi Chill</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePin}>
                  {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  <span className="sr-only">{isPinned ? "Unpin" : "Pin"}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                </Button>
              </div>
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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTime(currentTrack?.currentTime || 0)}</span>
              <Progress value={progressValue} className="flex-1 h-1.5" />
              <span>{formatTime(currentTrack?.duration || 0)}</span>
            </div>
          </CardContent>
        ) : (
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Music className="h-5 w-5" />}
            <span className="sr-only">{isPlaying ? "Pause Lofi Audio" : "Play Lofi Audio"}</span>
          </Button>
        )}
      </Card>
    </div>
  );
}