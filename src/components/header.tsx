"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Home, Bell, Search, Menu, LayoutGrid, MessageSquare } from "lucide-react"; // Added MessageSquare
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
import { JoinRoomByIdHeader } from "@/components/join-room-by-id-header";

interface HeaderProps {
  onOpenUpgradeModal: () => void;
  onToggleChat: () => void; // Now just a toggle function
  unreadChatCount: number; // Still need unread count for the button
  isMobile: boolean;
  onToggleSidebar: () => void;
}

export const Header = React.memo(({ onOpenUpgradeModal, onToggleChat, unreadChatCount, isMobile, onToggleSidebar }: HeaderProps) => {
  const { session } = useSupabase();
  const router = useRouter();
  const { currentRoomName, currentRoomId, isCurrentRoomWritable, setCurrentRoom } = useCurrentRoom();

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
        <ClockDisplay className="hidden md:flex" />
        <BackgroundBlurSlider className="hidden md:flex" />

        <JoinRoomByIdHeader />

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
            unreadCount={unreadChatCount}
            onClearUnread={() => {}} // NotificationsDropdown will manage its own unread state
            onNewUnread={() => {}} // NotificationsDropdown will manage its own unread state
          />
        )}
        {session && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChat} // Use the passed toggle function
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