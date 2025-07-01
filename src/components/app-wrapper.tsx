"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { ContactWidget } from "@/components/contact-widget";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { AdsBanner } from "@/components/ads-banner";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context"; // Import SidebarProvider and useSidebar
import { Sidebar } from "@/components/sidebar/sidebar"; // Import the new Sidebar
import { ChatPanel } from "@/components/chat-panel"; // Import ChatPanel

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';
const CHAT_PANEL_WIDTH_OPEN = 320; // px
const CHAT_PANEL_WIDTH_CLOSED = 48; // px (w-12)
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
  const [isChatOpen, setIsChatOpen] = useState(true); // New state for chat panel
  const [mounted, setMounted] = useState(false);

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

  const chatPanelCurrentWidth = isChatOpen ? CHAT_PANEL_WIDTH_OPEN : CHAT_PANEL_WIDTH_CLOSED;

  return (
    <>
      <Header
        onTogglePomodoroVisibility={handleTogglePomodoroVisibility}
        isPomodoroVisible={isPomodoroBarVisible}
        onOpenSpotifyModal={handleOpenSpotifyModal}
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
      <ContactWidget />
      <AdsBanner />
      {/* LofiAudioPlayer is now inside ChatPanel */}
      <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />
      <Toaster />
      {/* Fixed Chat Panel */}
      <div className="fixed right-0 top-16 bottom-0 transition-all duration-300 ease-in-out" style={{ width: `${chatPanelCurrentWidth}px` }}>
        <ChatPanel isOpen={isChatOpen} onToggleOpen={() => setIsChatOpen(!isChatOpen)} />
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