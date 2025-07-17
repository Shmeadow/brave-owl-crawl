"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Menu, LayoutGrid, MessageSquare, BarChart2, Settings } from "lucide-react";
import { useSupabase } from "@/integrations/supabase/auth";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { BackgroundBlurSlider } from "@/components/background-blur-slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SpacesWidget } from "@/components/widget-content/spaces-widget";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useWidget } from "@/components/widget/widget-provider";
import { UserNameCapsule } from "./user-name-capsule";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RoomSettingsContent } from "./spaces-widget/RoomSettingsContent";
import { CreatePersonalRoomForm } from "./create-personal-room-form";
import { BugReportButton } from "./bug-report-button";
import { TimeAndProgressDisplay, useClock } from "./time-and-progress-display";

interface HeaderProps {
  onToggleChat: () => void;
  onNewUnreadMessage: () => void;
  onClearUnreadMessages: () => void;
  unreadChatCount: number;
  isMobile: boolean;
  // Removed onToggleSidebar: () => void;
  isChatOpen: boolean;
}

const ClockTrigger = () => {
  const { timeString, dateString, isLoading } = useClock();
  return (
    <Button className="bg-background/50 backdrop-blur-xl text-header-button-dark-foreground font-mono text-sm px-3 hidden md:flex flex-col h-auto py-1 hover:bg-header-button-dark/80">
      {isLoading ? (
        <span>--:--:--</span>
      ) : (
        <>
          <span>{timeString}</span>
          <span className="text-xs opacity-70">{dateString}</span>
        </>
      )}
    </Button>
  );
};

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
      "fixed top-0 z-[1002] w-full flex items-center justify-between py-2 px-1 gap-2 h-16", // Added h-16 here
      "bg-background/60 backdrop-blur-xl border-b border-white/20 shadow-lg" // Applied transparent background and blur here
    )}>
      {/* Left Group */}
      <div className="flex items-center gap-1 min-w-0">
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

      {/* Right Group */}
      <div className={cn(
        "flex items-center gap-1",
        "justify-end"
      )}>
        <UserNameCapsule />
        <BugReportButton />
        {session && <NotificationsDropdown />}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ClockTrigger />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto p-0" align="end">
            <TimeAndProgressDisplay />
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Mobile-only chat button */}
        {isMobile && (
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
        )}
        <UserNav isMobile={isMobile} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';