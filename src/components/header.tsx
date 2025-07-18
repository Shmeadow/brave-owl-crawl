"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, LayoutGrid, MessageSquare, BarChart2, Settings } from "lucide-react";
import { useSupabase } from "@/integrations/supabase/auth";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { BackgroundBlurSlider } from "@/components/background-blur-slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useWidget } from "@/components/widget/widget-provider";
import { UserNameCapsule } from "./user-name-capsule";
import { cn } from "@/lib/utils";
import { RoomSettingsContent } from "./spaces-widget/RoomSettingsContent";
import { CreatePersonalRoomForm } from "./create-personal-room-form";
import { BugReportButton } from "./bug-report-button";
import SunCalc from 'suncalc'; // Import SunCalc

// Helper function to format time manually
export const formatTimeManual = (date: Date, use24Hour: boolean) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  let ampm = '';

  if (!use24Hour) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours ? hours : 12; // the hour '0' should be '12'
  }

  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${ampm ? ` ${ampm}` : ''}`;
};

// Helper function to format date manually
export const formatDateManual = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// New hook to provide live time data
export const useClock = () => {
  const { profile, loading: authLoading } = useSupabase();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const use24HourFormat = profile?.time_format_24h ?? true;
  const timeString = formatTimeManual(time, use24HourFormat);
  const dateString = formatDateManual(time);

  return { time, timeString, dateString, isLoading: authLoading };
};

const HeaderClockAndProgress = () => {
  const { time, timeString, dateString, isLoading } = useClock();
  const [dailyProgress, setDailyProgress] = useState(0);
  const [gradient, setGradient] = useState('linear-gradient(to right, hsl(240 20% 15%), hsl(40 60% 70%))');

  useEffect(() => {
    const now = time;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const progress = ((now.getTime() - startOfDay.getTime()) / (endOfDay.getTime() - startOfDay.getTime())) * 100;
    setDailyProgress(progress);

    const lat = 51.5074; // Default location (London)
    const lon = -0.1278;
    const times = SunCalc.getTimes(now, lat, lon);

    const sunrise = times.sunrise.getTime();
    const sunset = times.sunset.getTime();
    const nowTime = now.getTime();

    let newGradient;
    if (nowTime < sunrise) {
      newGradient = 'linear-gradient(to right, hsl(240 20% 10%), hsl(25 30% 25%))';
    } else if (nowTime < times.solarNoon.getTime()) {
      newGradient = 'linear-gradient(to right, hsl(45 90% 55%), hsl(50 80% 70%))';
    } else if (nowTime < sunset) {
      newGradient = 'linear-gradient(to right, hsl(50 80% 70%), hsl(15 85% 55%))';
    } else {
      newGradient = 'linear-gradient(to right, hsl(15 85% 55%), hsl(240 20% 10%))';
    }
    setGradient(newGradient);
  }, [time]);

  return (
    <div className={cn(
      "bg-background/50 backdrop-blur-xl text-header-button-dark-foreground font-mono text-sm px-3 py-1 rounded-md",
      "hidden md:flex items-center justify-center gap-2" // Changed to flex-row, added gap-2
    )}>
      {isLoading ? (
        <span>--:--:--</span>
      ) : (
        <>
          <span className="font-bold text-base text-foreground">{timeString}</span>
          <span className="text-xs opacity-70">{dateString}</span>
          <div className="w-16 h-1 rounded-full overflow-hidden relative bg-muted">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
              style={{ width: `${dailyProgress}%`, background: gradient }}
            >
              <div className="shimmer-effect"></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface HeaderProps {
  onToggleChat: () => void;
  onNewUnreadMessage: () => void;
  onClearUnreadMessages: () => void;
  unreadChatCount: number;
  isMobile: boolean;
  isChatOpen: boolean;
}

export const Header = React.memo(({ onToggleChat, unreadChatCount, isMobile, isChatOpen }: HeaderProps) => {
  const { session, profile } = useSupabase();
  const { currentRoomName } = useCurrentRoom();
  const { rooms } = useRooms();
  const { toggleWidget } = useWidget();
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  const usersPersonalRoom = rooms.find(room => room.id === profile?.personal_room_id && room.creator_id === session?.user?.id) || null;
  const userOwnsPersonalRoom = !!usersPersonalRoom;

  const handleRoomCreated = (newRoom: RoomData) => {
    setIsRoomSettingsOpen(false);
  };

  return (
    <header className={cn(
      "fixed top-0 z-[1002] w-full flex items-center justify-between py-2 px-1 gap-2 h-14",
      "bg-background/60 backdrop-blur-xl border-b border-white/20 shadow-lg"
    )}>
      {/* Left Group */}
      <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center space-x-1">
          <h1 className="text-lg font-bold text-primary hidden sm:block">Cozy Hub</h1>
          <Button className="h-8 w-8 hover:bg-header-button-dark/20" variant="ghost" size="icon" title="Home">
            <Home className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-base font-semibold truncate max-w-[120px] sm:max-w-[200px]">{currentRoomName}</h1>
        <Button
          className="flex-shrink-0 h-8 w-8 hover:bg-header-button-dark/20"
          variant="ghost"
          size="icon"
          title="Spaces"
          onClick={() => toggleWidget('spaces', 'Spaces')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        {session && (
          <Popover open={isRoomSettingsOpen} onOpenChange={setIsRoomSettingsOpen}>
            <PopoverTrigger asChild>
              <Button className="flex-shrink-0 h-8 w-8 hover:bg-header-button-dark/20" variant="ghost" size="icon" title="Room Options">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 z-[1100] p-0 bg-popover/80 backdrop-blur-lg border-white/20" align="start" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
              {userOwnsPersonalRoom && usersPersonalRoom ? (
                <RoomSettingsContent room={usersPersonalRoom} />
              ) : (
                <CreatePersonalRoomForm onRoomCreated={handleRoomCreated} onClose={() => setIsRoomSettingsOpen(false)} />
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Clock and Progress - now directly in the header, centered by justify-between */}
      <HeaderClockAndProgress />

      {/* Right Group */}
      <div className={cn(
        "flex items-center gap-1 flex-shrink-0",
        "justify-end"
      )}>
        {/* Render BackgroundBlurSlider only on desktop */}
        {!isMobile && <BackgroundBlurSlider className="hidden md:flex bg-background/50 rounded-full" />}
        <Button
          className="h-8 w-8 hover:bg-header-button-dark/20"
          variant="ghost"
          size="icon"
          title="Statistics"
          onClick={() => toggleWidget('stats-progress', 'Statistics')}
        >
          <BarChart2 className="h-4 w-4" />
        </Button>
        <BugReportButton />
        <UpgradeButton />
        <UserNameCapsule />
        {session && <NotificationsDropdown />}
        {/* Chat button (now always visible) */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 hover:bg-header-button-dark/20"
          title="Open Chat"
          onClick={onToggleChat}
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadChatCount}
            </span>
          )}
        </Button>
        <UserNav isMobile={isMobile} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';