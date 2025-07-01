"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
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
import { UpgradeModal } from "@/components/upgrade-modal";

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';

interface AppWrapperContextType {
  setIsSpotifyModalOpen: (isOpen: boolean) => void;
}

const AppWrapperContext = createContext<AppWrapperContextType | undefined>(undefined);

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(false);
  const [isPomodoroBarVisible, setIsPomodoroBarVisible] = useState(true);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      setIsPomodoroWidgetMinimized(savedMinimized === 'true');

      const savedVisible = localStorage.getItem(LOCAL_STORAGE_POMODORO_VISIBLE_KEY);
      setIsPomodoroBarVisible(savedVisible !== 'false');
    }
    setMounted(true);
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
    setIsPomodoroWidgetMinimized(false);
  };

  const handleHidePomodoro = () => {
    setIsPomodoroBarVisible(false);
    setIsPomodoroWidgetMinimized(false);
  };

  return (
    <SessionContextProvider>
      <AppWrapperContext.Provider value={{ setIsSpotifyModalOpen }}>
        <Header
          onTogglePomodoroVisibility={handleTogglePomodoroVisibility}
          isPomodoroVisible={isPomodoroBarVisible}
          onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-transparent pt-[80px] pb-80 mx-auto max-w-7xl w-full"> {/* Adjusted pt for fixed header */}
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
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <Toaster />
      </AppWrapperContext.Provider>
    </SessionContextProvider>
  );
}

export const useAppWrapperContext = () => {
  const context = useContext(AppWrapperContext);
  if (context === undefined) {
    throw new Error('useAppWrapperContext must be used within an AppWrapper');
  }
  return context;
};