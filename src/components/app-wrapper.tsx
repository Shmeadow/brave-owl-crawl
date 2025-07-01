"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { LofiAudioPlayer } from "@/components/lofi-audio-player";
import { WidgetProvider } from "@/components/widget/widget-context";
import { WidgetContainer } from "@/components/widget/widget-container";
// Removed ClockDisplay import

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible'; // This key is no longer directly used for visibility, but for initial state
const CHAT_PANEL_WIDTH_OPEN = 320; // px
const CHAT_PANEL_WIDTH_CLOSED = 56; // px (w-14)
const HEADER_HEIGHT = 64; // px (h-14 + py-2*2 = 56 + 8 = 64)

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

// Inner component to use useSidebar hook
function AppWrapperContent({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar();

  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(true);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
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
      const sidebarWidth = isSidebarOpen ? 60 : 0; // Changed from 4 to 0 for full hide
      const chatPanelWidth = isChatOpen ? CHAT_PANEL_WIDTH_OPEN : CHAT_PANEL_WIDTH_CLOSED;
      
      setMainContentArea({
        left: sidebarWidth,
        top: HEADER_HEIGHT,
        width: window.innerWidth - sidebarWidth - chatPanelWidth,
        height: window.innerHeight - HEADER_HEIGHT,
      });
    };

    // Update on mount, resize, and when sidebar/chat state changes
    updateMainContentArea();
    window.addEventListener('resize', updateMainContentArea);
    return () => window.removeEventListener('resize', updateMainContentArea);
  }, [isSidebarOpen, isChatOpen]); // Dependencies for recalculation

  const shouldShowPomodoro = pathname !== '/account' && pathname !== '/admin-settings'; // Hide on account/admin pages

  const handleOpenSpotifyModal = () => {
    setIsSpotifyModalOpen(true);
  };

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

  return (
    <WidgetProvider initialWidgetConfigs={WIDGET_CONFIGS} mainContentArea={mainContentArea}>
      <Header
        onTogglePomodoroVisibility={() => setIsPomodoroWidgetMinimized(prev => !prev)} // Toggle minimize
        isPomodoroVisible={!isPomodoroWidgetMinimized} // Pass minimized state as visibility
        onOpenSpotifyModal={handleOpenSpotifyModal}
        onOpenUpgradeModal={handleOpenUpgradeModal}
        dailyProgress={dailyProgress}
      />
      <Sidebar />
      <main
        className={`flex flex-col flex-1 w-full h-[calc(100vh-${HEADER_HEIGHT}px)] overflow-auto transition-all duration-300 ease-in-out`} // Changed min-h to h
        style={{ marginLeft: isSidebarOpen ? '60px' : '0px', marginRight: `${chatPanelCurrentWidth}px` }} // Changed margin-left to 0px when closed
      >
        {children}
      </main>
      <GoalReminderBar />
      {mounted && shouldShowPomodoro && (
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
          onClose={() => { /* Pomodoro widget no longer has a close button, only minimize */ }}
          chatPanelWidth={chatPanelCurrentWidth}
        />
      )}
      <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModal(false)} />
      <Toaster />
      <LofiAudioPlayer />
      {/* Fixed Chat Panel */}
      <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
        <ChatPanel
          isOpen={isChatOpen}
          onToggleOpen={() => setIsChatOpen(prev => !prev)}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadCount={unreadChatCount}
        />
      </div>
      <WidgetContainer />
    </WidgetProvider>
  );
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <SessionContextProvider>
      <SidebarProvider>
        <AppWrapperContent>{children}</AppWrapperContent>
      </SidebarProvider>
    </SessionContextProvider>
  );
}