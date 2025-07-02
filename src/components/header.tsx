"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Sun, Moon, Bell, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { ChatPanel } from "@/components/chat-panel";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/user-nav";
import { UpgradeButton } from "@/components/upgrade-button";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { toast } from "sonner";

interface HeaderProps {
  // onOpenSpotifyModal: () => void; // Removed this prop
  onOpenUpgradeModal: () => void;
  dailyProgress: number;
}

export function Header({ onOpenUpgradeModal, dailyProgress }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { theme, setTheme, mounted } = useTheme();
  const { session, profile } = useSupabase();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);
  const router = useRouter();
  const { currentRoomName } = useCurrentRoom();

  useEffect(() => {
    // Only run on client side after component has mounted
    if (!mounted) return;

    const updateClock = () => {
      setCurrentTime(new Date());
    };

    updateClock(); // Initial call on client mount
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, [mounted]); // Depend on mounted state

  const formattedTime = currentTime?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: profile?.time_format_24h === false,
  }) || '--:--:--'; // Placeholder for server render

  const formattedDate = currentTime?.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) || '--- --'; // Placeholder for server render

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast.info(`Theme changed to ${theme === "dark" ? "light" : "dark"}`);
  };

  const handleNewUnreadMessage = () => {
    setUnreadChatMessages((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatMessages(0);
  };

  const displayName = profile?.first_name || profile?.last_name || session?.user?.email?.split('@')[0] || "Guest";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md flex items-center h-16 px-4 md:px-6">
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
          {displayName}'s Room
        </h1>
      </div>

      {/* Right Section: Clock, Progress Bar, and Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Clock and Progress */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-foreground leading-none">{formattedTime}</p>
            <p className="text-sm text-muted-foreground leading-none">{formattedDate}</p>
          </div>
          <div className="w-full mt-1">
            <Progress value={dailyProgress} className="h-2 rounded-full" />
          </div>
        </div>

        {/* Other action buttons */}
        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} />
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )
          ) : (
            <div className="h-6 w-6" /> // Placeholder for hydration
          )}
          <span className="sr-only">Toggle Theme</span>
        </Button>
        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
        {session && (
          <ChatPanel
            isOpen={isChatOpen}
            onToggleOpen={() => setIsChatOpen(!isChatOpen)}
            onNewUnreadMessage={handleNewUnreadMessage}
            onClearUnreadMessages={handleClearUnreadMessages}
            unreadCount={unreadChatMessages}
          />
        )}
        <UserNav />
      </div>
    </header>
  );
}