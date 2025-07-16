"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Bell, Search, Menu, LayoutGrid, MessageSquare, Copy, BarChart2, Settings } from "lucide-react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useWidget } from "@/components/widget/widget-provider";
import { UserNameCapsule } from "./user-name-capsule"; // Import new component
import { cn } from "@/lib/utils"; // Import cn for styling
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover
import { RoomSettingsContent } from "@/components/spaces-widget/RoomSettingsContent"; // Import RoomSettingsContent
import { CreatePersonalRoomForm } from "./create-personal-room-form"; // Import new component
import { BugReportButton } from "./bug-report-button"; // Import the new component

interface HeaderProps {
  onToggleChat: () => void;
  onNewUnreadMessage: () => void;
  onClearUnreadMessages: () => void;
  unreadChatCount: number;
  isMobile: boolean;
  onToggleSidebar: () => void;
  isChatOpen: boolean;
}

export const Header = React.memo(({ onToggleChat, unreadChatCount, isMobile, onToggleSidebar, isChatOpen, onNewUnreadMessage, onClearUnreadMessages }: HeaderProps) => {
  const { session, profile } = useSupabase();
  const router = useRouter();
  const { currentRoomName, currentRoomId, isCurrentRoomWritable, setCurrentRoom } = useCurrentRoom();
  const { rooms } = useRooms();
  const { toggleWidget } = useWidget();
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  // Find the user's personal room based on profile.personal_room_id
  const usersPersonalRoom = rooms.find(room => room.id === profile?.personal_room_id && room.creator_id === session?.user?.id) || null;
  const userOwnsPersonalRoom = !!usersPersonalRoom;

  const handleRoomCreated = (newRoom: RoomData) => {
    // This callback is handled by CreatePersonalRoomForm, which already sets current room and closes itself.
    // No additional logic needed here, just ensures the popover closes.
    setIsRoomSettingsOpen(false);
  };

  return (
    <header className={cn(
      "sticky top-0 z-[1002] w-full h-16 flex items-center",
      "bg-card/50 backdrop-blur-xl border-b border-white/20"
    )}>
      <div className="flex items-center flex-1 min-w-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            title="Open Menu"
            className="ml-2" // Add margin for mobile
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open Menu</span>
          </Button>
        )}
        <div className={cn(
          "flex items-center gap-2",
          isMobile ? "px-2" : "px-4 py-2 rounded-full border border-white/20" // Adjust padding/border for mobile
        )}>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">Cozy Hub</h1>
          </Link>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" title="Home">
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <h1 className="text-xl font-semibold flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-0">
              <span className="truncate">{currentRoomName}</span>
            </h1>
            {session && ( // Only show settings cog if logged in
              <Popover open={isRoomSettingsOpen} onOpenChange={setIsRoomSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Room Options"
                    className="flex-shrink-0"
                  >
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
      </div>

      <div className={cn(
        "flex items-center gap-2 ml-auto",
        isMobile ? "pr-2" : "px-4 py-2 rounded-full border border-white/20" // Adjust padding/border for mobile
      )}>
        {/* Always visible on mobile */}
        <BugReportButton />
        {session && (
          <NotificationsDropdown />
        )}
        <UserNameCapsule />
        
        {/* Hidden on mobile */}
        <Button
          variant="ghost"
          size="icon"
          title="Stats & Progress"
          onClick={() => toggleWidget('stats-progress', 'Stats & Progress')}
          className="hidden md:flex" // Hide on mobile
        >
          <BarChart2 className="h-5 w-5" />
          <span className="sr-only">Stats & Progress</span>
        </Button>
        <BackgroundBlurSlider className="hidden md:flex" /> {/* Already hidden */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Manage Spaces" className="hidden md:flex"> {/* Hide on mobile */}
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
        <UpgradeButton className="hidden md:flex" /> {/* Hide on mobile */}
        <ThemeToggle className="hidden md:flex" /> {/* Hide on mobile */}
        
        {/* Always visible on mobile */}
        {session && (
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
        )}
        <UserNav />
      </div>
    </header>
  );
});

Header.displayName = 'Header';