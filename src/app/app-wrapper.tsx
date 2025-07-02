"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { WidgetProvider } from "@/components/widget/widget-context";
import { WidgetContainer } from "@/components/widget/widget-container";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { MediaPlayerBar } from "@/components/media-player-bar";
import { useMediaPlayer } from "@/components/media-player-context";

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const CHAT_PANEL_WIDTH_OPEN = 320; // px
const CHAT_PANEL_WIDTH_CLOSED = 56; // px (w-14)
const HEADER_HEIGHT = 64; // px (h-14 + py-2*2 = 56 + 8 = 64)
const SIDEBAR_WIDTH = 60; // px

// Define initial configurations for all widgets here to pass to WidgetProvider
const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 150, y: 100 }, initialWidth: 600, initialHeight: 700 },
  "sounds": { initialPosition: { x: 800, y: 150 }, initialWidth: 500, initialHeight: 600 },
  "calendar": { initialPosition: { x: 200, y: 200 }, initialWidth: 800, initialHeight: 700 },
  "timer": { initialPosition: { x: 900, y: 250 }, initialWidth: 400, initialHeight: 400 },
  "tasks": { initialPosition: { x: 250, y: 300 }, initialWidth: 500, initialHeight: 600 },
  "notes": { initialPosition: { x: 700, y: 350 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 300, y: 400 }, initialWidth: 600, initialHeight: 500 },
  "fortune": { initialPosition: { x: 850, y: 450 }, initialWidth: 400, initialHeight: 300 },
  "breathe": { initialPosition: { x: 350, y: 500 }, initialWidth: 400, initialHeight: 300 },
  "flash-cards": { initialPosition: { x: 500, y: 100 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 400, y: 550 }, initialWidth: 500, initialHeight: 600 },
};

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar();
  const { isAlwaysOpen } = useSidebarPreference();
  const { youtubeEmbedUrl, spotifyEmbedUrl } = useMediaPlayer();

  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [dailyProgress, setDailyProgress] = useState(0);

  // State to hold the dimensions of the main content area
  const [mainContentArea, setMainContentArea] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      setIsPomodoroWidgetMinimized(savedMinimized === 'false' ? false : true);
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY, String(isPomodoroWidgetMinimized));
    }
  }, [isPomodoroWidgetMinimized, mounted]);

  // Calculate daily progress
  useEffect(() => {
    const updateDailyProgress = () => {
      const now = new Date();
      const secondsIntoDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const totalSecondsInDay = 24 * 3600;
      setDailyProgress((secondsIntoDay / totalSecondsInDay) * 100);
    };

    updateDailyProgress(); // Initial call
    const intervalId = setInterval(updateDailyProgress, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, []);

  // Calculate main content area dimensions dynamically
  useEffect(() => {
    const updateMainContentArea = () => {
      const sidebarCurrentWidth = (isAlwaysOpen || isSidebarOpen) ? SIDEBAR_WIDTH : 0;
      const chatPanelWidth = isChatOpen ? CHAT_PANEL_WIDTH_OPEN : CHAT_PANEL_WIDTH_CLOSED;
      
      setMainContentArea({
        left: sidebarCurrentWidth,
        top: HEADER_HEIGHT,
        width: window.innerWidth - sidebarCurrentWidth - chatPanelWidth,
        height: window.innerHeight - HEADER_HEIGHT,
      });
    };

    updateMainContentArea();
    window.addEventListener('resize', updateMainContentArea);
    return () => window.removeEventListener('resize', updateMainContentArea);
  }, [isSidebarOpen, isChatOpen, isAlwaysOpen]);

  const shouldShowPomodoro = pathname !== '/account' && pathname !== '/admin-settings';

  const handleOpenUpgradeModal = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleNewUnreadMessage = () => {
    setUnreadChatCount(prev => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  const chatPanelCurrentWidth = isChatOpen ? CHAT_PANEL_WIDTH_OPEN : CHAT_PANEL_WIDTH_CLOSED;
  const sidebarCurrentWidth = (isAlwaysOpen || isSidebarOpen) ? SIDEBAR_WIDTH : 0;

  return (
    <>
      <WidgetProvider initialWidgetConfigs={WIDGET_CONFIGS} mainContentArea={mainContentArea}>
        <Header
          onOpenUpgradeModal={handleOpenUpgradeModal}
          dailyProgress={dailyProgress}
        />
        <Sidebar />
        <main
          className={`flex flex-col flex-1 w-full h-[calc(100vh-${HEADER_HEIGHT}px)] overflow-auto transition-all duration-300 ease-in-out`}
          style={{ marginLeft: `${sidebarCurrentWidth}px`, marginRight: `${chatPanelCurrentWidth}px` }}
        >
          {children}
        </main>
        <GoalReminderBar />
        {mounted && shouldShowPomodoro && (
          <PomodoroWidget
            isMinimized={isPomodoroWidgetMinimized}
            setIsMinimized={setIsPomodoroWidgetMinimized}
            chatPanelWidth={chatPanelCurrentWidth}
          />
        )}
        {mounted && (youtubeEmbedUrl || spotifyEmbedUrl) && <MediaPlayerBar />}
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <Toaster />
        <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
          <ChatPanel
            isOpen={isChatOpen}
            onToggleOpen={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) {
                handleClearUnreadMessages();
              }
            }}
            onNewUnreadMessage={handleNewUnreadMessage}
            onClearUnreadMessages={handleClearUnreadMessages}
            unreadCount={unreadChatCount}
          />
        </div>
        <WidgetContainer />
      </WidgetProvider>
    </>
  );
}