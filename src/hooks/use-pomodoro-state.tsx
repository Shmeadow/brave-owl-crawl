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
    if (!supabase) return;
    setLoading(true);
    try {
      if (session) {
        setIsLoggedInMode(true);
        let query = supabase
          .from('pomodoro_settings')
          .select('*')
          .eq('user_id', session.user.id);

        if (currentRoomId) {
          query = query.eq('room_id', currentRoomId);
        } else {
          query = query.is('room_id', null);
        }

        const { data: supabaseSettings, error: fetchError } = await query.single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (supabaseSettings) {
          settingsIdRef.current = supabaseSettings.id;
          const newCustomTimes = {
            focus: supabaseSettings.focus_time,
            'short-break': supabaseSettings.short_break_time,
            'long-break': supabaseSettings.long_break_time,
          };
          setState(prev => ({ ...prev, customTimes: newCustomTimes, timeLeft: newCustomTimes[prev.mode] }));
        } else {
          const localTimes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY) || JSON.stringify(DEFAULT_TIMES));
          const { data: newSettings, error: insertError } = await supabase
            .from('pomodoro_settings')
            .insert({ user_id: session.user.id, room_id: currentRoomId, focus_time: localTimes.focus, short_break_time: localTimes['short-break'], long_break_time: localTimes['long-break'] })
            .select()
            .single();
          if (insertError) throw insertError;
          if (newSettings) {
            settingsIdRef.current = newSettings.id;
            setState(prev => ({ ...prev, customTimes: localTimes, timeLeft: localTimes[prev.mode] }));
            localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
          }
        }
      } else {
        setIsLoggedInMode(false);
        const localTimes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY) || JSON.stringify(DEFAULT_TIMES));
        setState(prev => ({ ...prev, customTimes: localTimes, timeLeft: localTimes[prev.mode] }));
      }
    } catch (error: any) {
      toast.error("Failed to load pomodoro settings: " + error.message);
      console.error("Error fetching pomodoro settings:", error);
    } finally {
      setLoading(false);
    }
  }, [session, supabase, currentRoomId]);

  useEffect(() => {
    if (!authLoading) {
      loadPomodoroSettings();
    }
  }, [authLoading, loadPomodoroSettings]);

  const updateCustomTimes = useCallback(async (newCustomTimes: typeof DEFAULT_TIMES) => {
    if (isLoggedInMode && session && supabase) {
      if (settingsIdRef.current) {
        const { error } = await supabase
          .from('pomodoro_settings')
          .update({
            focus_time: newCustomTimes.focus,
            short_break_time: newCustomTimes['short-break'],
            long_break_time: newCustomTimes['long-break'],
          })
          .eq('id', settingsIdRef.current);
        if (error) toast.error("Failed to save settings: " + error.message);
      } else {
        // If no settings ID exists, it means we need to create one for this context
        const { data: newSettings, error: insertError } = await supabase
          .from('pomodoro_settings')
          .insert({ user_id: session.user.id, room_id: currentRoomId, focus_time: newCustomTimes.focus, short_break_time: newCustomTimes['short-break'], long_break_time: newCustomTimes['long-break'] })
          .select()
          .single();
        if (insertError) toast.error("Failed to save new settings: " + insertError.message);
        else if (newSettings) settingsIdRef.current = newSettings.id;
      }
    } else if (!isLoggedInMode) {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(newCustomTimes));
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const setCustomTime = useCallback((mode: PomodoroMode, newTimeInSeconds: number) => {
    setState(prevState => {
      const updatedCustomTimes = { ...prevState.customTimes, [mode]: newTimeInSeconds };
      updateCustomTimes(updatedCustomTimes);
      return {
        ...prevState,
        customTimes: updatedCustomTimes,
        timeLeft: prevState.mode === mode ? newTimeInSeconds : prevState.timeLeft,
      };
    });
  }, [updateCustomTimes]);

  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setState(prevState => ({ ...prevState, timeLeft: prevState.timeLeft - 1 }));
      }, 1000);
    } else if (state.timeLeft === 0 && state.isRunning) {
      const nextMode = state.mode === 'focus' ? 'short-break' : 'focus';
      toast.success(state.mode === 'focus' ? "Focus session complete!" : "Break's over!");
      setState(prevState => ({
        ...prevState,
        mode: nextMode,
        timeLeft: prevState.customTimes[nextMode],
        isRunning: false,
      }));
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.timeLeft]);

  const handleStartPause = () => setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  const handleReset = () => setState(prev => ({ ...prev, timeLeft: prev.customTimes[prev.mode], isRunning: false }));
  const handleSwitchMode = (newMode: PomodoroMode) => setState(prev => ({ ...prev, mode: newMode, timeLeft: prev.customTimes[newMode], isRunning: false }));
  const handleTimeDisplayClick = () => setState(prev => ({ ...prev, isEditingTime: true, editableTimeString: formatTime(prev.timeLeft) }));
  const handleTimeInputBlur = () => {
    setState(prevState => {
      const newTime = parseTimeToSeconds(prevState.editableTimeString);
      if (!isNaN(newTime) && newTime >= 0) {
        const updatedCustomTimes = { ...prevState.customTimes, [prevState.mode]: newTime };
        updateCustomTimes(updatedCustomTimes);
        return { ...prevState, customTimes: updatedCustomTimes, timeLeft: newTime, isEditingTime: false };
      }
      toast.error("Invalid time format.");
      return { ...prevState, isEditingTime: false };
    });
  };
  const setEditableTimeString = (value: string) => setState(prev => ({ ...prev, editableTimeString: value }));

  return { ...state, setEditableTimeString, handleStartPause, handleReset, handleSwitchMode, handleTimeDisplayClick, handleTimeInputBlur, setCustomTime, loading };
}