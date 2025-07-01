"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Menu, Volume2, VolumeX, Play, Pause, Gem, Home } from "lucide-react"; // Added Gem, Home
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useRoom } from "@/hooks/use-room";
import { useSunriseSunset } from "@/hooks/use-sunrise-sunset";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle"; // Added ThemeToggle
import { UserNav } from "@/components/user-nav"; // Added UserNav
import { useSidebar } from "@/components/sidebar/sidebar-context"; // Added useSidebar
import { useSupabase } from "@/integrations/supabase/auth"; // Added useSupabase
import { useRouter } from "next/navigation"; // Added useRouter

interface HeaderProps {
  onTogglePomodoroVisibility: () => void;
  isPomodoroVisible: boolean;
  onOpenSpotifyModal: () => void;
  onOpenUpgradeModal: () => void;
  dailyProgress: number;
}

export function Header({
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
  const { setIsSidebarOpen } = useSidebar(); // Use setIsSidebarOpen directly
  const { profile } = useSupabase(); // Get profile for time format
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);
    };

    updateClock(); // Initial call
    const intervalId = setInterval(updateClock, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit", // Ensure seconds are always shown
    hour12: !(profile?.time_format_24h ?? true), // Use profile setting, default to 24h (true)
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-md z-10 relative h-16"> {/* Adjusted padding and height */}
      {/* Left Section: Menu, Home, Room Name, Search */}
      <div className="flex items-center space-x-2"> {/* Reduced space-x */}
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(prev => !prev)} className="lg:hidden h-8 w-8"> {/* Smaller button */}
          <Menu className="h-5 w-5" /> {/* Smaller icon */}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8"> {/* Home button */}
          <Home className="h-5 w-5" />
          <span className="sr-only">Go to Home Room</span>
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-primary">Room:</span>
          <Input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-28 h-8 px-2 py-1 text-sm rounded-md bg-input/50 border-border focus:border-primary" // Smaller input
          />
        </div>
        <div className="relative w-32"> {/* Smaller search input */}
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /> {/* Smaller icon */}
          <Input
            type="text"
            placeholder="Search..."
            className="pl-7 pr-2 py-1 h-8 text-sm rounded-md bg-input/50 border-border focus:border-primary" // Smaller input
          />
        </div>
      </div>

      {/* Center Section: Clock and Progress Bar */}
      <div className="flex flex-col items-center gap-1 flex-grow max-w-xs mx-auto"> {/* Reduced max-w and gap */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground leading-none">{formattedTime}</p> {/* Smaller font */}
          <p className="text-xs text-muted-foreground">{formattedDate}</p> {/* Smaller font */}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full relative group">
                <Progress value={dailyProgress} className="h-1.5 w-full bg-muted-foreground/20" /> {/* Smaller height */}
                <div className="absolute inset-0 cursor-pointer" /> {/* Invisible overlay for hover */}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg z-[1002]"> {/* Increased z-index */}
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

      {/* Right Section: Music Controls, Upgrade, Theme Toggle, User Nav */}
      <div className="flex items-center space-x-2"> {/* Reduced space-x */}
        {currentTrack && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8" // Smaller button
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />} {/* Smaller icon */}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>
            <div className="flex items-center space-x-1"> {/* Reduced space-x */}
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8"> {/* Smaller button */}
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />} {/* Smaller icon */}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1.5 accent-primary" // Smaller width and height
              />
            </div>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={onOpenUpgradeModal} className="h-8 w-8"> {/* Upgrade button */}
          <Gem className="h-5 w-5" />
          <span className="sr-only">Upgrade Account</span>
        </Button>
        <ThemeToggle /> {/* Theme selector */}
        <UserNav /> {/* Account icon */}
      </div>
    </header>
  );
}