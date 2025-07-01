"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { ContactWidget } from "@/components/contact-widget"; // Import ContactWidget

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  // Initialize to false for server-side rendering to prevent hydration mismatch
  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(false);
  const [mounted, setMounted] = useState(false); // New state to track if component has mounted on client

  useEffect(() => {
    // This effect runs only on the client after initial render
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      setIsPomodoroWidgetMinimized(savedMinimized === 'true');
    }
    setMounted(true); // Mark as mounted after client-side state is initialized
  }, []);

  // Effect to save minimized state to local storage (only runs on client after mounted)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY, String(isPomodoroWidgetMinimized));
    }
  }, [isPomodoroWidgetMinimized, mounted]);

  return (
    <SessionContextProvider>
      {children}
      <GoalReminderBar />
      {mounted && ( // Conditionally render PomodoroWidget only after client mount
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
        />
      )}
      <ContactWidget /> {/* Add the ContactWidget here */}
      <Toaster />
    </SessionContextProvider>
  );
}