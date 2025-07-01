"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { UpgradeModal } from "@/components/upgrade-modal"; // Import UpgradeModal
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context"; // Import SidebarProvider and useSidebar
import { Sidebar } from "@/components/sidebar/sidebar"; // Import the new Sidebar
import { ChatPanel } from "@/components/chat-panel"; // Import ChatPanel
import { LofiAudioPlayer } from "@/components/lofi-audio-player"; // Import the component

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';
const CHAT_PANEL_WIDTH_OPEN = 320; // px
const CHAT_PANEL_WIDTH_CLOSED = 56; // px (w-14)
const WIDGET_GAP = 16; // px

interface AppWrapperProps {
  children: React.ReactNode;
}

// Inner component to use useSidebar hook
function AppWrapperContent({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar(); // Get sidebar open state from context

  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(true);
  const [isPomodoroBarVisible, setIsPomodoroBarVisible] = useState(true);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // New state for upgrade modal
  const [isChatOpen, setIsChatOpen] = useState(false); // Chat starts closed as a bubble
  const [unreadChatCount, setUnreadChatCount] = useState(0); // New state for unread chat messages
  const [mounted, setMounted] = useState(false);
  const [dailyProgress, setDailyProgress] = useState(0); // State for daily progress

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
        dailyProgress={dailyProgress} // Pass dailyProgress here
      />
      <Sidebar /> {/* Render the new Sidebar */}
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
          chatPanelWidth={chatPanelCurrentWidth} // Pass chat width for positioning
        />
      )}
      <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModal(false)} /> {/* Render UpgradeModal */}
      <Toaster />
      <LofiAudioPlayer /> {/* The actual audio element, now global */}
      {/* Fixed Chat Panel */}
      <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
        <ChatPanel
          isOpen={isChatOpen}
          onToggleOpen={() => setIsChatOpen(!isChatOpen)}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadCount={unreadChatCount}
        />
      </div>
    </>
  );
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <SessionContextProvider>
      <SidebarProvider> {/* Wrap with SidebarProvider */}
        <AppWrapperContent>{children}</AppWrapperContent>
      </SidebarProvider>
    </SessionContextProvider>
  );
}