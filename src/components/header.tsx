"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Bell, Search, Menu, LayoutGrid, MessageSquare } from "lucide-react";
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

interface HeaderProps {
  onOpenUpgradeModal: () => void;
  onToggleChat: () => void;
  unreadChatCount: number;
  isMobile: boolean;
  onToggleSidebar: () => void;
}

export const Header = React.memo(({ onOpenUpgradeModal, onToggleChat, unreadChatCount, isMobile, onToggleSidebar }: HeaderProps) => {
  const { session } = useSupabase();
  const router = useRouter();
  const { currentRoomName, currentRoomId, isCurrentRoomWritable, setCurrentRoom } = useCurrentRoom();
  const { handleJoinRoomByCode } = useRooms(); // Use the hook for joining rooms

  const [roomCodeInput, setRoomCodeInput] = useState("");

  const handleJoinRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!roomCodeInput.trim()) {
      toast.error("Please enter a room code.");
      return;
    }
    await handleJoinRoomByCode(roomCodeInput.trim());
    setRoomCodeInput(""); // Clear input after attempt
  };

  return (
    <header className="sticky top-0 z-[1002] w-full border-b bg-background/80 backdrop-blur-md flex items-center h-16">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentRoom(null, "My Room")}
          title="Go to My Room"
          className={isMobile ? "hidden" : ""}
        >
          <Home className="h-6 w-6" />
          <span className="sr-only">Go to My Room</span>
        </Button>
        <h1 className="text-xl font-semibold hidden sm:block">
          {currentRoomName}
        </h1>
      </div>

      <div className="flex items-center gap-4 ml-auto pr-4">
        {/* Join Room Input and Button */}
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Room Code"
            className="w-32 text-sm h-9"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && roomCodeInput.trim()) {
                handleJoinRoom();
              }
            }}
            disabled={!session}
          />
          <Button
            onClick={handleJoinRoom}
            size="sm"
            className="h-9"
            disabled={!session || !roomCodeInput.trim()}
          >
            Join
          </Button>
        </div>

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

        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} />
        <ThemeToggle />
        {session && (
          <NotificationsDropdown
            unreadCount={unreadChatCount} // Reusing unreadChatCount for general notifications for now
            onClearUnread={() => {}} // NotificationsDropdown will manage its own unread state
            onNewUnread={() => {}} // NotificationsDropdown will manage its own unread state
          />
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