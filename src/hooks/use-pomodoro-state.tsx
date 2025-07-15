"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "./use-current-room";

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes: {
    'focus': number;
    'short-break': number;
    'long-break': number;
  };
  isEditingTime: boolean;
  editableTimeString: string;
}

interface SupabasePomodoroSettings {
  id: string;
  user_id: string;
  room_id: string | null;
  focus_time: number;
  short_break_time: number;
  long_break_time: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TIMES = {
  'focus': 30 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

const LOCAL_STORAGE_CUSTOM_TIMES_KEY = 'pomodoro_custom_times';

export const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
};

export const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
};

export function usePomodoroState() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [state, setState] = useState<PomodoroState>({
    mode: 'focus',
    timeLeft: DEFAULT_TIMES.focus,
    isRunning: false,
    customTimes: DEFAULT_TIMES,
    isEditingTime: false,
    editableTimeString: '',
  });
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const settingsIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPomodoroSettings = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      const query = supabase.from('pomodoro_settings').select('*');
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }
      const { data: supabaseSettings, error: fetchError } = await query.single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        toast.error("Error fetching pomodoro settings: " + fetchError.message);
        setState(prevState => ({ ...prevState, customTimes: DEFAULT_TIMES, timeLeft: DEFAULT_TIMES[prevState.mode] }));
      } else if (supabaseSettings) {
        settingsIdRef.current = supabaseSettings.id;
        const newCustomTimes = {
          focus: supabaseSettings.focus_time,
          'short-break': supabaseSettings.short_break_time,
          'long-break': supabaseSettings.long_break_time,
        };
        setState(prevState => ({
          ...prevState,
          customTimes: newCustomTimes,
          timeLeft: newCustomTimes[prevState.mode],
        }));
      } else {
        // No settings found for this context, use defaults. A new record will be created on save.
        settingsIdRef.current = null;
        setState(prevState => ({ ...prevState, customTimes: DEFAULT_TIMES, timeLeft: DEFAULT_TIMES[prevState.mode] }));
      }
    } else {
      setIsLoggedInMode(false);
      // Guest mode only has one set of settings
      const storedCustomTimesString = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
      const loadedCustomTimes = storedCustomTimesString ? JSON.parse(storedCustomTimesString) : DEFAULT_TIMES;
      setState(prevState => ({
        ...prevState,
        customTimes: loadedCustomTimes,
        timeLeft: loadedCustomTimes[prevState.mode],
      }));
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    loadPomodoroSettings();
  }, [loadPomodoroSettings]);

  const saveSettings = useCallback(async (timesToSave: typeof DEFAULT_TIMES) => {
    if (isLoggedInMode && session && supabase) {
      const record = {
        user_id: session.user.id,
        room_id: currentRoomId,
        focus_time: timesToSave.focus,
        short_break_time: timesToSave['short-break'],
        long_break_time: timesToSave['long-break'],
      };
      const { data, error } = await supabase.from('pomodoro_settings').upsert(record, { onConflict: 'user_id,room_id' }).select().single();
      if (error) {
        toast.error("Failed to save settings: " + error.message);
      } else if (data) {
        settingsIdRef.current = data.id;
        toast.success("Settings saved!");
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(timesToSave));
      toast.success("Settings saved locally!");
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setState(prevState => ({ ...prevState, timeLeft: prevState.timeLeft - 1 }));
      }, 1000);
    } else if (state.timeLeft === 0 && state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState(prevState => {
        const nextMode = prevState.mode === 'focus' ? 'short-break' : 'focus';
        toast.success(prevState.mode === 'focus' ? "✨ Focus session complete! Time for a break." : "Break complete! Time to focus again.");
        return {
          ...prevState,
          mode: nextMode,
          timeLeft: prevState.customTimes[nextMode],
          isRunning: false,
        };
      });
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.timeLeft]);

  const handleStartPause = useCallback(() => {
    setState(prevState => ({ ...prevState, isRunning: !prevState.isRunning }));
    toast.info(state.isRunning ? "Timer paused." : "Timer started!");
  }, [state.isRunning]);

  const handleReset = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isRunning: false,
      timeLeft: prevState.customTimes[prevState.mode],
    }));
    toast.warning("Timer reset.");
  }, []);

  const handleSwitchMode = useCallback((newMode: PomodoroMode) => {
    setState(prevState => ({
      ...prevState,
      mode: newMode,
      timeLeft: prevState.customTimes[newMode],
      isRunning: false,
    }));
    toast.info(`Switched to ${newMode.replace('-', ' ')} mode.`);
  }, []);

  const handleTimeDisplayClick = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isEditingTime: true,
      editableTimeString: formatTime(prevState.timeLeft),
    }));
  }, []);

  const handleTimeInputBlur = useCallback(async () => {
    const newTime = parseTimeToSeconds(state.editableTimeString);
    if (!isNaN(newTime) && newTime >= 0) {
      const updatedCustomTimes = { ...state.customTimes, [state.mode]: newTime };
      setState(prevState => ({
        ...prevState,
        customTimes: updatedCustomTimes,
        timeLeft: newTime,
        isEditingTime: false,
      }));
      await saveSettings(updatedCustomTimes);
    } else {
      toast.error("Invalid time format. Please use HH:MM:SS.");
      setState(prevState => ({ ...prevState, isEditingTime: false }));
    }
  }, [state.editableTimeString, state.customTimes, state.mode, saveSettings]);

  const setEditableTimeString = useCallback((value: string) => {
    setState(prevState => ({ ...prevState, editableTimeString: value }));
  }, []);

  const setCustomTime = useCallback(async (mode: PomodoroMode, newTimeInSeconds: number) => {
    const updatedCustomTimes = { ...state.customTimes, [mode]: newTimeInSeconds };
    setState(prevState => ({
      ...prevState,
      customTimes: updatedCustomTimes,
      timeLeft: prevState.mode === mode ? newTimeInSeconds : prevState.timeLeft,
    }));
    await saveSettings(updatedCustomTimes);
  }, [state.customTimes, saveSettings]);

  return {
    mode: state.mode,
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    customTimes: state.customTimes,
    isEditingTime: state.isEditingTime,
    editableTimeString: state.editableTimeString,
    setEditableTimeString,
    handleStartPause,
    handleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime,
    loading,
  };
}