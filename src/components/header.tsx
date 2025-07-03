"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Bell, Search, Settings } from "lucide-react"; // Removed Sun, Moon
import { useTheme } from "next-themes"; // Still needed for mounted check
import { ChatPanel } from "@/components/chat-panel";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { toast } from "sonner";
import { ClockDisplay } from "@/components/clock-display"; // Import ClockDisplay
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

interface HeaderProps {
  onOpenUpgradeModal: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onNewUnreadMessage: () => void;
  onClearUnreadMessages: () => void;
  unreadChatCount: number;
}

export function Header({ onOpenUpgradeModal, isChatOpen, onToggleChat, onNewUnreadMessage, onClearUnreadMessages, unreadChatCount }: HeaderProps) {
  const { session, profile } = useSupabase();
  const router = useRouter();
  const { currentRoomName, currentRoomId, isCurrentRoomWritable } = useCurrentRoom(); // Destructure currentRoomId here

  const displayName = profile?.first_name || profile?.last_name || session?.user?.email?.split('@')[0] || "Guest";

  return (
    <header className="sticky top-0 z-[1002] w-full border-b bg-background backdrop-blur-xl flex items-center h-16 px-4 md:px-6">
      {/* Left Section: Search Input, Home Button, and Title */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-grow max-w-xs sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search other rooms..."
            className="pl-8"
          />
        </div>
        {/* Home Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard')}
          title="Go to My Room"
        >
          <Home className="h-6 w-6" />
          <span className="sr-only">Go to My Room</span>
        </Button>
        <h1 className="text-xl font-semibold hidden sm:block">
          {currentRoomName}
        </h1>
      </div>

      {/* Right Section: Clock, Progress Bar, and Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Clock and Progress */}
        <ClockDisplay /> {/* No dailyProgress prop needed */}

        {/* Other action buttons */}
        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} />
        <ThemeToggle /> {/* Added ThemeToggle here */}
        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} title="Settings">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
        {session && (
          <ChatPanel
            isOpen={isChatOpen}
            onToggleOpen={onToggleChat}
            onNewUnreadMessage={onNewUnreadMessage}
            onClearUnreadMessages={onClearUnreadMessages}
            unreadCount={unreadCount}
            currentRoomId={currentRoomId} // Pass currentRoomId
            isCurrentRoomWritable={isCurrentRoomWritable} // Pass isCurrentRoomWritable
          />
        )}
        <UserNav />
      </div>
    </header>
  );
}