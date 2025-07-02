"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Sun, Moon, Bell, Search } from "lucide-react"; // Removed Settings icon
import { useTheme } from "next-themes";
import { ChatPanel } from "@/components/chat-panel";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/user-nav"; // Import UserNav
import { UpgradeButton } from "@/components/upgrade-button"; // Import UpgradeButton
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

interface HeaderProps {
  onOpenSpotifyModal: () => void;
  onOpenUpgradeModal: () => void;
  dailyProgress: number; // Keep dailyProgress for the clock
}

export function Header({ onOpenSpotifyModal, onOpenUpgradeModal, dailyProgress }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { theme, setTheme } = useTheme();
  const { session, profile } = useSupabase();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);
  const router = useRouter();
  const { currentRoomName } = useCurrentRoom(); // Get current room name

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date());
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: profile?.time_format_24h === false,
  }) || '--:--:--';
  
  const formattedDate = currentTime?.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) || '--- --';

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

  const displayUserName = profile?.first_name || profile?.last_name || session?.user?.email?.split('@')[0] || "Guest";

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
          onClick={() => router.push('/dashboard')} // Navigate to dashboard
          title="Go to My Room"
        >
          <Home className="h-6 w-6" />
          <span className="sr-only">Go to My Room</span>
        </Button>
        <h1 className="text-xl font-semibold hidden sm:block truncate max-w-[150px]"> {/* Added truncate and max-w */}
          {currentRoomName}
        </h1>
      </div>

      {/* Center Section: Clock and Progress Bar */}
      <div className="flex flex-col items-center gap-1 flex-grow mx-auto w-full">
        <div className="flex items-baseline gap-2"> {/* Time and Date side-by-side */}
          <p className="text-4xl font-bold text-foreground leading-none">{formattedTime}</p>
          <p className="text-sm text-muted-foreground leading-none">{formattedDate}</p>
        </div>
        {/* Progress Bar */}
        <div className="w-full mt-1">
          <Progress value={dailyProgress} className="h-2 rounded-full" /> {/* Taller height */}
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} /> {/* Replaced Search with UpgradeButton */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === "dark" ? (
            <Sun className="h-6 w-6" />
          ) : (
            <Moon className="h-6 w-6" />
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
        <UserNav /> {/* Replaced Settings with UserNav */}
      </div>
    </header>
  );
}