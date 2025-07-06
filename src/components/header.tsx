"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Bell, Search, Menu, LayoutGrid, MessageSquare, Copy } from "lucide-react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { ClockDisplay } from "@/components/clock-display";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackgroundBlurSlider } from "@/components/background-blur-slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpacesWidget } from "@/components/widget-content/spaces-widget";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useRooms } from "@/hooks/use-rooms"; // Import useRooms for join functionality
import { toast } from "sonner"; // Import toast for notifications
import Link from "next/link"; // Import Link

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
  const { handleJoinRoomByRoomId } = useRooms(); // Use the hook for joining rooms

  // Removed roomInput state and handleJoinRoom function

  const handleCopyRoomId = () => {
    if (currentRoomId) {
      navigator.clipboard.writeText(currentRoomId);
      toast.success("Room ID copied to clipboard!");
    } else {
      toast.error("No room ID to copy.");
    }
  };

  return (
    <header className="sticky top-0 z-[1002] w-full border-b bg-transparent backdrop-blur-xl flex items-center h-16">
      <div className="flex items-center gap-2 pl-4">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            title="Open Menu"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open Menu</span>
          </Button>
        )}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary">CozyHub</h1>
        </Link>
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" title="Home">
            <Home className="h-6 w-6" />
            <span className="sr-only">Home</span>
          </Button>
        </Link>
        {currentRoomId && (
          <span
            className="text-sm font-mono text-muted-foreground cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={handleCopyRoomId}
            title="Copy Room ID"
          >
            ({currentRoomId.substring(0, 8)}...)
            <Copy className="h-3 w-3" />
          </span>
        )}
        {/* Adjusted h1 to be always visible and truncate if needed */}
        <h1 className="text-xl font-semibold flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
          {session?.user?.id && (
            <span
              className="text-sm font-mono text-muted-foreground cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors"
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
        </h1>
      </div>

      <div className="flex items-center gap-4 ml-auto pr-4">
        {/* Removed Join Room Input and Button */}

        <ClockDisplay className="hidden md:flex" />
        <BackgroundBlurSlider className="hidden md:flex" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Manage Spaces">
              <LayoutGrid className="h-6 w-6" />
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
            <MessageSquare className="h-6 w-6" />
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