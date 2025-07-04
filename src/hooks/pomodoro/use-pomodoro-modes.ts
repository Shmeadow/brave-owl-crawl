"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PomodoroMode } from "@/lib/pomodoro-utils"; // Updated import path

interface UsePomodoroModesProps {
  onModeChange: (newMode: PomodoroMode) => void;
}

export function usePomodoroModes({ onModeChange }: UsePomodoroModesProps) {
  const [mode, setMode] = useState<PomodoroMode>('focus');

  const switchMode = useCallback((newMode: PomodoroMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      onModeChange(newMode);
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : newMode === 'short-break' ? 'Short Break' : 'Long Break'} mode.`);
    }
  }, [mode, onModeChange]);

  return {
    mode,
    switchMode,
  };
}