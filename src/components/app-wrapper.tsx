"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { ContactWidget } from "@/components/contact-widget";
import { usePathname } from "next/navigation"; // Import usePathname
import { Header } from "@/components/header"; // Import Header
import { AdsBanner } from "@/components/ads-banner"; // Import AdsBanner
import { LofiAudioPlayer } from "@/components/lofi-audio-player"; // Import LofiAudioPlayer
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal"; // Import SpotifyEmbedModal
import { UpgradeModal } from "@/components/upgrade-modal"; // Import UpgradeModal

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(false);
  const [isPomodoroBarVisible, setIsPomodoroBarVisible] = useState(true); // New state for overall visibility
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false); // State for Spotify modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // State for Upgrade modal
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      setIsPomodoroWidgetMinimized(savedMinimized === 'true');

      const savedVisible = localStorage.getItem(LOCAL_STORAGE_POMODORO_VISIBLE_KEY);
      setIsPomodoroBarVisible(savedVisible !== 'false'); // Default to true if not set
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

  const shouldShowPomodoro = pathname !== '/account'; // Condition to hide on /account page

  const handleTogglePomodoroVisibility = () => {
    setIsPomodoroBarVisible(prev => !prev);
    setIsPomodoroWidgetMinimized(false); // Unminimize when shown
  };

  const handleHidePomodoro = () => {
    setIsPomodoroBarVisible(false);
    setIsPomodoroWidgetMinimized(false); // Ensure it's not minimized when hidden
  };

  return (
    <SessionContextProvider>
      <Header
        onTogglePomodoroVisibility={handleTogglePomodoroVisibility}
        isPomodoroVisible={isPomodoroBarVisible}
        onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)} // Pass handler to Header
      />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-background pb-80 mx-auto max-w-7xl w-full">
        {children}
      </main>
      <GoalReminderBar />
      {mounted && shouldShowPomodoro && isPomodoroBarVisible && (
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
          onClose={handleHidePomodoro} // Pass the new close handler
        />
      )}
      <ContactWidget />
      <AdsBanner />
      <LofiAudioPlayer />
      <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} /> {/* Add UpgradeModal */}
      <Toaster />
    </SessionContextProvider>
  );
}