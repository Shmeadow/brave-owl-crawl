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

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';
const CHAT_PANEL_WIDTH_OPEN = 320; // px
const CHAT_PANEL_WIDTH_CLOSED = 56; // px (w-14)
const WIDGET_GAP = 16; // px

// Define initial configurations for all widgets here to pass to WidgetProvider
const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 100, y: 100 }, initialWidth: 600, initialHeight: 700 },
  "sounds": { initialPosition: { x: 750, y: 100 }, initialWidth: 500, initialHeight: 600 },
  "calendar": { initialPosition: { x: 100, y: 150 }, initialWidth: 800, initialHeight: 700 },
  "timer": { initialPosition: { x: 950, y: 150 }, initialWidth: 400, initialHeight: 400 },
  "tasks": { initialPosition: { x: 100, y: 200 }, initialWidth: 500, initialHeight: 600 },
  "notes": { initialPosition: { x: 650, y: 200 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 100, y: 250 }, initialWidth: 600, initialHeight: 500 },
  "fortune": { initialPosition: { x: 750, y: 250 }, initialWidth: 400, initialHeight: 300 },
  "breathe": { initialPosition: { x: 100, y: 300 }, initialWidth: 400, initialHeight: 300 },
  "flash-cards": { initialPosition: { x: 550, y: 300 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 100, y: 350 }, initialWidth: 500, initialHeight: 600 },
};

interface AppWrapperProps {
  children: React.ReactNode;
}

// Inner component to use useSidebar hook
function AppWrapperContent({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar();

  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(true);
  const [isPomodoroBarVisible, setIsPomodoroBarVisible] = useState(true);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [dailyProgress, setDailyProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      setIsPomodoroWidgetMinimized(savedMinimized === 'false' ? false : true);

      const savedVisible = localStorage.getItem(LOCAL_STORAGE_POMODORO_VISIBLE_KEY);
      setIsPomodoroBarVisible(savedVisible === 'false' ? false : true);
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY, String(isPomodoroWidgetMinimized));
    }
  }, [isPomodoroWidgetMinimized, mounted]);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_VISIBLE_KEY, String(isPomodoroBarVisible));
    }
  }, [isPomodoroBarVisible, mounted]);

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

  const shouldShowPomodoro = pathname !== '/account';

  const handleTogglePomodoroVisibility = () => {
    setIsPomodoroBarVisible(prev => !prev);
    setIsPomodoroWidgetMinimized(false); // Unminimize when shown
  };

  const handleHidePomodoro = () => {
    setIsPomodoroBarVisible(false);
    setIsPomodoroWidgetMinimized(false); // Ensure it's not minimized when hidden
  };

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
    <>
      <Header
        onTogglePomodoroVisibility={handleTogglePomodoroVisibility}
        isPomodoroVisible={isPomodoroBarVisible}
        onOpenSpotifyModal={handleOpenSpotifyModal}
        onOpenUpgradeModal={handleOpenUpgradeModal}
        dailyProgress={dailyProgress}
      />
      <Sidebar />
      <main
        className={`flex flex-col flex-1 w-full h-full transition-all duration-300 ease-in-out`}
        style={{ marginLeft: isSidebarOpen ? '60px' : '4px', marginRight: `${chatPanelCurrentWidth}px` }}
      >
        {children}
      </main>
      <GoalReminderBar />
      {mounted && shouldShowPomodoro && isPomodoroBarVisible && (
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
          onClose={handleHidePomodoro}
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
    </>
  );
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <SessionContextProvider>
      <SidebarProvider>
        <WidgetProvider initialWidgetConfigs={WIDGET_CONFIGS}>
          <AppWrapperContent>{children}</AppWrapperContent>
        </WidgetProvider>
      </SidebarProvider>
    </SessionContextProvider>
  );
}