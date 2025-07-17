"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Menu, LayoutGrid, MessageSquare, BarChart2, Settings } from "lucide-react";
import { useSupabase } from "@/integrations/supabase/auth";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { RoomSettingsContent } from "@/components/spaces-widget/RoomSettingsContent";
import { CreatePersonalRoomForm } from "./create-personal-room-form";
import { BugReportButton } from "./bug-report-button";
import { TimeAndProgressDisplay, useClock } from "@/components/time-and-progress-display";

interface HeaderProps {
  onToggleChat: () => void;
  onNewUnreadMessage: () => void;
  onClearUnreadMessages: () => void;
  unreadChatCount: number;
  isMobile: boolean;
  onToggleSidebar: () => void;
  isChatOpen: boolean;
}

const ClockTrigger = () => {
  const { timeString, isLoading } = useClock();
  return (
    <Button variant="ghost" className="font-mono text-base px-3 hidden md:flex">
      {isLoading ? "--:--:--" : timeString}
    </Button>
  );
};

export const Header = React.memo(({ onToggleChat, unreadChatCount, isMobile, onToggleSidebar }: HeaderProps) => {
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
      "sticky top-0 z-[1002] w-full h-16 flex items-center justify-between p-2 gap-2"
    )}>
      {/* Left Capsule */}
      <div className={cn(
        "flex items-center flex-1 min-w-0 gap-2 px-4 py-2",
        "bg-card/50 backdrop-blur-xl border border-white/20 rounded-full"
      )}>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} title="Open Menu">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary hidden sm:block">Cozy Hub</h1>
          <Button variant="ghost" size="icon" title="Home">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          <h1 className="text-xl font-semibold truncate">{currentRoomName}</h1>
          {session && (
            <Popover open={isRoomSettingsOpen} onOpenChange={setIsRoomSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Room Options" className="flex-shrink-0">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 z-[1100] p-0 bg-popover/80 backdrop-blur-lg border-white/20" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                {userOwnsPersonalRoom && usersPersonalRoom ? (
                  <RoomSettingsContent room={usersPersonalRoom} />
                ) : (
                  <CreatePersonalRoomForm onRoomCreated={handleRoomCreated} onClose={() => setIsRoomSettingsOpen(false)} />
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Right Capsule */}
      <div className={cn(
        "flex items-center gap-1 px-2 py-2",
        "bg-card/50 backdrop-blur-xl border border-white/20 rounded-full"
      )}>
        <UserNameCapsule />
        <BugReportButton />
        {session && <NotificationsDropdown />}
        <BackgroundBlurSlider className="hidden md:flex" />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ClockTrigger />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto p-0" align="end">
            <TimeAndProgressDisplay />
          </DropdownMenuContent>
        </DropdownMenu>
        <UserNav />
      </div>
    </header>
  );
});

Header.displayName = 'Header';