"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { usePersistentData } from "./use-persistent-data"; // Import the new hook

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

interface PomodoroCustomTimes {
  'focus': number;
  'short-break': number;
  'long-break': number;
}

interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes: PomodoroCustomTimes;
  isEditingTime: boolean;
  editableTimeString: string;
}

interface DbPomodoroSettings {
  id: string;
  user_id: string;
  focus_time: number;
  short_break_time: number;
  long_break_time: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TIMES: PomodoroCustomTimes = {
  'focus': 30 * 60, // 30 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
};

const LOCAL_STORAGE_CUSTOM_TIMES_KEY = 'pomodoro_custom_times';
const SUPABASE_TABLE_NAME = 'pomodoro_settings';

// Helper to convert seconds to HH:MM:SS format
export const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

// Helper to convert HH:MM:SS string to seconds
export const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) { // SS format (if user just types seconds)
    return parts[0];
  }
  return 0; // Invalid format
};

export function usePomodoroState() {
  const { supabase, session } = useSupabase();

  const {
    data: customTimes,
    loading: customTimesLoading,
    isLoggedInMode,
    setData: setCustomTimes,
    fetchData: fetchCustomTimes,
  } = usePersistentData<PomodoroCustomTimes, DbPomodoroSettings>({ // T_APP_DATA is PomodoroCustomTimes, T_DB_DATA_ITEM is DbPomodoroSettings
    localStorageKey: LOCAL_STORAGE_CUSTOM_TIMES_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: DEFAULT_TIMES,
    selectQuery: 'focus_time, short_break_time, long_break_time',
    transformFromDb: (dbData: DbPomodoroSettings) => ({
      focus: dbData.focus_time,
      'short-break': dbData.short_break_time,
      'long-break': dbData.long_break_time,
    }),
    transformToDb: (appData: PomodoroCustomTimes, userId: string) => ({ // appItem is PomodoroCustomTimes, returns DbPomodoroSettings
      user_id: userId,
      focus_time: appData.focus,
      short_break_time: appData['short-break'],
      long_break_time: appData['long-break'],
      id: crypto.randomUUID(), // Generate UUID for new records
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    onConflictColumn: 'user_id',
    isSingleton: true,
    debounceDelay: 500,
  });

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editableTimeString, setEditableTimeString] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timeLeft when customTimes or mode changes
  useEffect(() => {
    if (!customTimesLoading) {
      setTimeLeft(customTimes[mode]);
    }
  }, [customTimes, mode, customTimesLoading]);

  const getCurrentModeTime = useCallback(() => {
    return customTimes[mode];
  }, [mode, customTimes]);

  const resetTimer = useCallback((newMode: PomodoroMode, shouldStopRunning: boolean = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const newTimeLeft = customTimes[newMode];

    setMode(newMode);
    setTimeLeft(newTimeLeft);
    setIsRunning(shouldStopRunning ? false : isRunning);
    setIsEditingTime(false);
    setEditableTimeString('');
  }, [customTimes, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      let nextMode: PomodoroMode;
      if (mode === 'focus') {
        nextMode = 'short-break';
        toast.success("✨ Focus session complete! Time for a well-deserved break.");
      } else {
        nextMode = 'focus';
        toast.success("Break complete! Time to focus again.");
      }
      setMode(nextMode);
      setTimeLeft(customTimes[nextMode]);
      setIsRunning(false);
      setIsEditingTime(false);
      setEditableTimeString('');
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode, customTimes]);

  const handleStartPause = useCallback(() => {
    setIsRunning(prev => {
      const newIsRunning = !prev;
      const newTimeLeft = timeLeft === 0 ? getCurrentModeTime() : timeLeft;
      setTimeLeft(newTimeLeft); // Ensure timeLeft is reset if it was 0
      toast.info(newIsRunning ? "Timer started!" : "Timer paused.");
      return newIsRunning;
    });
  }, [timeLeft, getCurrentModeTime]);

  const handleReset = useCallback(() => {
    resetTimer(mode, true);
    toast.warning("Timer reset.");
  }, [mode, resetTimer]);

  const handleSwitchMode = useCallback((newMode: PomodoroMode) => {
    if (mode !== newMode) {
      resetTimer(newMode, false); // Switch mode, but keep running state if it was running
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : newMode === 'short-break' ? 'Short Break' : 'Long Break'} mode.`);
    }
  }, [mode, resetTimer]);

  const handleTimeDisplayClick = useCallback(() => {
    setIsEditingTime(true);
    setEditableTimeString(formatTime(timeLeft));
  }, [timeLeft]);

  const handleTimeInputBlur = useCallback(() => {
    const newTime = parseTimeToSeconds(editableTimeString);
    if (!isNaN(newTime) && newTime >= 0) {
      setCustomTimes(prev => ({ ...prev, [mode]: newTime }));
      setTimeLeft(newTime);
      toast.success("Timer time updated!");
    } else {
      toast.error("Invalid time format. Please use HH:MM:SS.");
      setTimeLeft(customTimes[mode]); // Revert to current mode's default if invalid
    }
    setIsEditingTime(false);
  }, [editableTimeString, customTimes, mode, setCustomTimes]);

  // New function to update custom times from settings modal
  const setCustomTime = useCallback(async (targetMode: PomodoroMode, newTimeInSeconds: number) => {
    setCustomTimes(prev => {
      const updatedCustomTimes = {
        ...prev,
        [targetMode]: newTimeInSeconds,
      };
      return updatedCustomTimes;
    });
    // If the current mode's time is being updated, also update timeLeft
    if (mode === targetMode) {
      setTimeLeft(newTimeInSeconds);
    }
  }, [mode, setCustomTimes]);

  return {
    mode,
    timeLeft,
    isRunning,
    customTimes,
    isEditingTime,
    editableTimeString,
    setEditableTimeString,
    handleStartPause,
    handleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime,
  };
}