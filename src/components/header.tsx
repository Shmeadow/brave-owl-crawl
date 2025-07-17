"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, LayoutGrid, BarChart2, Settings } from "lucide-react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackgroundBlurSlider } from "@/components/background-blur-slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface HeaderProps {
  onToggleChat: () => void;
  unreadChatCount: number;
}

export const Header = React.memo(({ onToggleChat, unreadChatCount }: HeaderProps) => {
  const { session, profile } = useSupabase();
  const router = useRouter();
  const { currentRoomName, currentRoomId, isCurrentRoomWritable, setCurrentRoom } = useCurrentRoom();
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
      "sticky top-0 z-[1002] w-full h-16 flex items-center justify-between px-4",
      "bg-card/50 backdrop-blur-xl border-b border-white/20"
    )}>
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary">Cozy Hub</h1>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" title="Home">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold truncate">{currentRoomName}</h1>
          {session && (
            <Popover open={isRoomSettingsOpen} onOpenChange={setIsRoomSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Room Options">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Room Options</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-96 z-[1100] p-0 bg-popover/80 backdrop-blur-lg border-white/20"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
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

      <div className="flex items-center gap-2">
        <BugReportButton />
        <UserNameCapsule />
        <Button
          variant="ghost"
          size="icon"
          title="Stats & Progress"
          onClick={() => toggleWidget('stats-progress', 'Stats & Progress')}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="sr-only">Stats & Progress</span>
        </Button>
        <BackgroundBlurSlider />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Manage Spaces">
              <LayoutGrid className="h-5 w-5" />
              <span className="sr-only">Manage Spaces</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[600px] z-[1003] p-0" align="end">
            <ScrollArea className="h-[80vh] max-h-[700px]">
              <SpacesWidget isCurrentRoomWritable={isCurrentRoomWritable} />
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
        <UpgradeButton />
        <ThemeToggle />
        {session && (
          <>
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleChat}
              title="Open Chat"
              className="relative"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Open Chat</span>
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadChatCount}
                </span>
              )}
            </Button>
          </>
        )}
        <UserNav />
      </div>
    </header>
  );
});

Header.displayName = 'Header';