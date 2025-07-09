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
import { useRooms } from "@/hooks/use-rooms";
import { toast } from "sonner";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useWidget } from "@/components/widget/widget-provider";
import { RoomSettingsDialog } from "@/components/room-settings-dialog";
import { UserNameCapsule } from "./user-name-capsule"; // Import new component
import { cn } from "@/lib/utils"; // Import cn for styling

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
  const { session } = useSupabase();
  const router = useRouter();
  const { currentRoomName, currentRoomId, isCurrentRoomWritable, setCurrentRoom } = useCurrentRoom();
  const { rooms, handleJoinRoomByRoomId } = useRooms();
  const { toggleWidget } = useWidget();

  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  const currentRoom = rooms.find(room => room.id === currentRoomId) || null; // Ensure null instead of undefined
  const isOwnerOfCurrentRoom = !!(currentRoom && session?.user?.id === currentRoom.creator_id); // Ensure boolean

  const handleCopyRoomId = () => {
    if (currentRoomId) {
      navigator.clipboard.writeText(currentRoomId);
      toast.success("Room ID copied to clipboard!");
    } else {
      toast.error("No room ID to copy.");
    }
  };

  return (
    <header className="sticky top-0 z-[1002] w-full border-b border-transparent bg-transparent flex items-center h-16">
      <div className="flex items-center pl-4">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open Menu</span>
          </Button>
        )}
        <div className={cn(
          "bg-card/50 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2",
          "flex items-center gap-2"
        )}>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">CozyHub</h1>
          </Link>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" title="Home">
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <h1 className="text-xl font-semibold flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-0">
              {!isMobile && session?.user?.id && (
                <span
                  className="text-sm font-mono text-muted-foreground cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(session.user.id);
                    toast.success("Your User ID copied to clipboard!");
                  }}
                  title="Copy Your User ID"
                >
                  ({session.user.id.substring(0, 6)})
                  <Copy className="h-3 w-3" />
                </span>
              )}
              <span className="truncate">{currentRoomName}</span>
              {isOwnerOfCurrentRoom && currentRoomId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRoomSettingsOpen(true)}
                  title="Room Settings"
                  className="ml-1 h-7 w-7 text-muted-foreground hover:text-primary"
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Room Settings</span>
                </Button>
              )}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto pr-4 bg-card/50 rounded-full px-4 py-2 border border-white/20">
        {/* New Stats & Progress Button */}
        <Button
          variant="ghost"
          size="icon"
          title="Stats & Progress"
          onClick={() => toggleWidget('stats-progress', 'Stats & Progress')}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="sr-only">Stats & Progress</span>
        </Button>

        <UserNameCapsule /> {/* New User Name Capsule */}
        <BackgroundBlurSlider className="hidden md:flex" />

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
          <NotificationsDropdown />
        )}
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
      <RoomSettingsDialog
        isOpen={isRoomSettingsOpen}
        onClose={() => setIsRoomSettingsOpen(false)}
        currentRoom={currentRoom}
        isOwnerOfCurrentRoom={isOwnerOfCurrentRoom}
      />
    </header>
  );
});

Header.displayName = 'Header';