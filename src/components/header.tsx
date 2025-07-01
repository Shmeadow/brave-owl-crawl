"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Menu, Volume2, VolumeX, Play, Pause, Gem, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useSunriseSunset } from "@/hooks/use-sunrise-sunset";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";

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
  // Initialize currentTime to null to prevent hydration mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { isPlaying, togglePlayPause, currentTrack, volume, setVolume, isMuted, toggleMute } = useMusicPlayer();
  const { times, loading: sunTimesLoading, error: sunTimesError } = useSunriseSunset();
  const { setIsSidebarOpen } = useSidebar();
  const { profile, user } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date());
    };

    // Set initial time on client mount
    updateClock();
    const intervalId = setInterval(updateClock, 1000);

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs once on mount

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: !(profile?.time_format_24h ?? true),
      })
    : "--:--:--"; // Placeholder for server render or until client time is set

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "--- --"; // Placeholder

  const displayUserName = profile?.first_name || user?.email?.split('@')[0] || "Guest";
  const roomName = `${displayUserName}'s Room`;

  return (
    <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-md z-10 relative h-16">
      {/* Left Section: Menu, Home, Room Name, Search */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(prev => !prev)} className="lg:hidden h-8 w-8">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8">
          <Home className="h-5 w-5" />
          <span className="sr-only">Go to Home Room</span>
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-sm text-foreground font-medium">{roomName}</span>
        </div>
        <div className="relative w-32">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-7 pr-2 py-1 h-8 text-sm rounded-md bg-input/50 border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Center Section: Clock and Progress Bar */}
      <div className="flex flex-col items-center gap-1 flex-grow max-w-xs mx-auto">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground leading-none">{formattedTime}</p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full relative group">
                <Progress value={dailyProgress} className="h-1.5 w-full bg-muted-foreground/20" />
                <div className="absolute inset-0 cursor-pointer" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg z-[1002]">
              {sunTimesLoading ? (
                <span>Loading sunrise/sunset...</span>
              ) : sunTimesError ? (
                <span className="text-red-500">{sunTimesError}</span>
              ) : times && times.sunrise && times.sunset ? (
                <div className="text-center">
                  <p>Sunrise: {times.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Sunset: {times.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ) : (
                <span>Could not get sunrise/sunset data. Please enable location services.</span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right Section: Music Controls, Upgrade, Theme Toggle, User Nav */}
      <div className="flex items-center space-x-2">
        {currentTrack && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1.5 accent-primary"
              />
            </div>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={onOpenUpgradeModal} className="h-8 w-8">
          <Gem className="h-5 w-5" />
          <span className="sr-only">Upgrade Account</span>
        </Button>
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}