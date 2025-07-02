"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Sun, Moon, Settings, Bell, MessageSquare, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { ChatPanel } from "@/components/chat-panel";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Import useRouter
import { Input } from "@/components/ui/input"; // Import Input component

interface HeaderProps {
  // isSidebarOpen and toggleSidebar props are no longer needed here
}

export function Header({}: HeaderProps) { // Removed props
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [progress, setProgress] = useState(0);
  const { theme, setTheme } = useTheme();
  const { session, profile } = useSupabase();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const totalMillisecondsInDay = endOfDay.getTime() - startOfDay.getTime();
      const elapsedMilliseconds = now.getTime() - startOfDay.getTime();
      const dailyProgress = (elapsedMilliseconds / totalMillisecondsInDay) * 100;
      setProgress(dailyProgress);
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
        <h1 className="text-xl font-semibold hidden sm:block">User's Room</h1>
      </div>

      {/* Center Section: Clock and Progress Bar */}
      <div className="flex flex-col items-center gap-1 flex-grow max-w-xs mx-auto w-full">
        <div className="flex justify-between items-baseline w-full">
          <p className="text-4xl font-bold text-foreground leading-none">{formattedTime}</p>
          <p className="text-base text-muted-foreground">{formattedDate}</p>
        </div>
        {/* Progress Bar */}
        <div className="w-full">
          <Progress value={progress} className="h-1 rounded-full" />
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" title="Search Rooms">
          <Search className="h-6 w-6" />
          <span className="sr-only">Search Rooms</span>
        </Button>
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
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}