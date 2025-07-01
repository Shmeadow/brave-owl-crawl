"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider, useSupabase } from "@/integrations/supabase/auth"; // Import useSupabase
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { ContactWidget } from "@/components/contact-widget";
import { useRouter, usePathname } from "next/navigation"; // Import useRouter
import { Header } from "@/components/header";
import { AdsBanner } from "@/components/ads-banner";
import { LofiAudioPlayer } from "@/components/lofi-audio-player";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { EnrollmentModal } from "@/components/enrollment-modal"; // Import EnrollmentModal

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const LOCAL_STORAGE_POMODORO_VISIBLE_KEY = 'pomodoro_widget_visible';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const router = useRouter(); // Initialize useRouter
  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(false);
  const [isPomodoroBarVisible, setIsPomodoroBarVisible] = useState(true);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false); // New state for enrollment modal
  const [mounted, setMounted] = useState(false);

  // Use useSupabase here to get login status
  const { session, loading: authLoading } = useSupabase();
  const isLoggedInMode = !!session;

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

  const handleOpenSpotifyModal = () => {
    setIsSpotifyModalOpen(true);
  };

  const handleOpenEnrollmentModal = () => {
    setIsEnrollmentModalOpen(true);
  };

  const handleLoginSignupFromEnrollment = () => {
    setIsEnrollmentModalOpen(false);
    router.push('/account'); // Redirect to account page for login/signup
  };

  return (
    <SessionContextProvider>
      <Header
        onTogglePomodoroVisibility={handleTogglePomodoroVisibility}
        isPomodoroVisible={isPomodoroBarVisible}
        onOpenSpotifyModal={handleOpenSpotifyModal}
      />
      {children}
      <GoalReminderBar />
      {mounted && shouldShowPomodoro && isPomodoroBarVisible && (
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
          onClose={handleHidePomodoro}
          isLoggedInMode={isLoggedInMode}
          onOpenEnrollmentModal={handleOpenEnrollmentModal}
        />
      )}
      <ContactWidget />
      <AdsBanner />
      <LofiAudioPlayer />
      <SpotifyEmbedModal isOpen={isSpotifyModalOpen} onClose={() => setIsSpotifyModalOpen(false)} />
      <EnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        onLoginSignup={handleLoginSignupFromEnrollment}
      />
      <Toaster />
    </SessionContextProvider>
  );
}