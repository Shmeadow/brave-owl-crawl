"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, Sun, Moon, Settings, Bell, MessageSquare, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // Initialize as null
  const [progress, setProgress] = useState(0);
  const { theme, setTheme } = useTheme();
  const { session, profile } = useSupabase();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);

  useEffect(() => {
    // This effect runs only on the client after hydration
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate daily progress (percentage of day passed)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const totalMillisecondsInDay = endOfDay.getTime() - startOfDay.getTime();
      const elapsedMilliseconds = now.getTime() - startOfDay.getTime();
      const dailyProgress = (elapsedMilliseconds / totalMillisecondsInDay) * 100;
      setProgress(dailyProgress);
    };

    updateClock(); // Initial call to set time and progress
    const timer = setInterval(updateClock, 1000); // Update every second

    return () => clearInterval(timer);
  }, []); // Empty dependency array ensures this runs once on mount

  const formattedTime = currentTime?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: profile?.time_format_24h === false,
  }) || '--:--:--'; // Placeholder until time is set
  
  const formattedDate = currentTime?.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) || '--- --'; // Placeholder until date is set

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
      {/* Left Section: Sidebar Toggle / Home Button */}
      <div className="flex items-center gap-2">
        <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleSidebar}
              title="Toggle Sidebar / Home"
            >
              <Home className="h-6 w-6" />
              <span className="sr-only">Toggle Sidebar / Home</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
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