"use client";

import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      return savedMinimized === 'true';
    }
    return false;
  });

  // Effect to save minimized state to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY, String(isPomodoroWidgetMinimized));
    }
  }, [isPomodoroWidgetMinimized]);

  return (
    <SessionContextProvider>
      {children}
      <GoalReminderBar />
      <PomodoroWidget
        isMinimized={isPomodoroWidgetMinimized}
        setIsMinimized={setIsPomodoroWidgetMinimized}
      />
      <Toaster />
    </SessionContextProvider>
  );
}