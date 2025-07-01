"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Menu, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useRoom } from "@/hooks/use-room";
import { useSunriseSunset } from "@/hooks/use-sunrise-sunset";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  onToggleSidebar: () => void;
  onTogglePomodoroVisibility: () => void;
  isPomodoroVisible: boolean;
  onOpenSpotifyModal: () => void;
  onOpenUpgradeModal: () => void;
  dailyProgress: number;
}

export function Header({
  onToggleSidebar,
  onTogglePomodoroVisibility,
  isPomodoroVisible,
  onOpenSpotifyModal,
  onOpenUpgradeModal,
  dailyProgress,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isPlaying, togglePlayPause, currentTrack, volume, setVolume, isMuted, toggleMute } = useMusicPlayer();
  const { roomName, setRoomName } = useRoom();
  const { times, loading: sunTimesLoading, error: sunTimesError } = useSunriseSunset();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md z-10 relative">
      {/* Left Section: Menu, Room Name, Search */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <span className="text-primary">Room:</span> {roomName}
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-2 py-1 rounded-md bg-input/50 border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Center Section: Clock and Progress Bar */}
      <div className="flex flex-col items-center gap-2 flex-grow max-w-md mx-auto">
        <div className="text-center">
          <p className="text-4xl font-bold text-foreground leading-none">{formattedTime}</p>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full relative group">
                <Progress value={dailyProgress} className="h-2 w-full bg-muted-foreground/20" />
                <div className="absolute inset-0 cursor-pointer" /> {/* Invisible overlay for hover */}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
              {sunTimesLoading ? (
                <span>Loading sunrise/sunset...</span>
              ) : sunTimesError ? (
                <span className="text-red-500">{sunTimesError}</span>
              ) : times ? (
                <div className="text-center">
                  <p>Sunrise: {times.sunrise?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Sunset: {times.sunset?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ) : (
                <span>Could not get sunrise/sunset data.</span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right Section: Music Controls */}
      <div className="flex items-center space-x-4">
        {currentTrack && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-10 w-10"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-10 w-10">
                {isMuted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-2 accent-primary"
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}