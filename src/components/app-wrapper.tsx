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
import { LofiAudioPlayer } from "@/components/lofi-audio-player";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context"; // Import SidebarProvider and useSidebar
import { Sidebar } from "@/components/sidebar/sidebar"; // Import the new Sidebar

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';

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
        style={{ marginLeft: isSidebarOpen ? '60px' : '4px' }} // Adjust margin based on sidebar open state
      >
        {children}
      </main>
      <GoalReminderBar />
      {mounted && shouldShowPomodoro && isPomodoroBarVisible && (
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
          onClose={handleHidePomodoro}
        />
      )}
      <ContactWidget />
      <AdsBanner />
      <LofiAudioPlayer />
      <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />
      <Toaster />
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