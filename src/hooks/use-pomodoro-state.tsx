"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth"; // Import useSupabase

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

// Define an interface for the structure of the saved state in local storage
interface SavedPomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes?: { // customTimes might be optional if not always present in old saved states
    'focus'?: number;
    'short-break'?: number;
    'long-break'?: number;
  };
}

// Define interface for Supabase data
interface SupabasePomodoroSettings {
  id: string;
  user_id: string;
  focus_time: number;
  short_break_time: number;
  long_break_time: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TIMES = {
  'focus': 30 * 60, // 30 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
};

const LOCAL_STORAGE_KEY = 'pomodoro_state';
const LOCAL_STORAGE_CUSTOM_TIMES_KEY = 'pomodoro_custom_times'; // Separate key for custom times

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
  const { supabase, session, loading: authLoading } = useSupabase();
  const [state, setState] = useState<PomodoroState>(() => {
    // Initial state for SSR, will be hydrated on client
    return {
      mode: 'focus',
      timeLeft: DEFAULT_TIMES.focus,
      isRunning: false,
      customTimes: DEFAULT_TIMES,
      isEditingTime: false,
      editableTimeString: '',
    };
  });
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const settingsIdRef = useRef<string | null>(null); // To store the Supabase settings ID

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadPomodoroSettings = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        // console.log("User logged in. Checking for local pomodoro settings to migrate..."); // Removed for cleaner logs

        // 1. Fetch user's existing settings from Supabase
        const { data: supabaseSettings, error: fetchError } = await supabase
          .from('pomodoro_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
          toast.error("Error fetching pomodoro settings: " + fetchError.message);
          console.error("Error fetching pomodoro settings (Supabase):", fetchError);
          setState(prevState => ({ ...prevState, customTimes: DEFAULT_TIMES, timeLeft: DEFAULT_TIMES.focus }));
        } else if (supabaseSettings) {
          // Settings found in Supabase
          settingsIdRef.current = supabaseSettings.id;
          setState(prevState => ({
            ...prevState,
            customTimes: {
              focus: supabaseSettings.focus_time,
              'short-break': supabaseSettings.short_break_time,
              'long-break': supabaseSettings.long_break_time,
            },
            timeLeft: prevState.mode === 'focus' ? supabaseSettings.focus_time :
                      prevState.mode === 'short-break' ? supabaseSettings.short_break_time :
                      supabaseSettings.long_break_time,
          }));
          // console.log("Loaded pomodoro settings from Supabase."); // Removed for cleaner logs
        } else {
          // No settings in Supabase, check local storage for migration
          const localCustomTimesString = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
          let localCustomTimes: typeof DEFAULT_TIMES = DEFAULT_TIMES;
          try {
            localCustomTimes = localCustomTimesString ? JSON.parse(localCustomTimesString) : DEFAULT_TIMES;
          } catch (e) {
            console.error("Error parsing local storage custom times:", e);
            localCustomTimes = DEFAULT_TIMES;
          }

          if (localCustomTimes !== DEFAULT_TIMES) {
            // console.log("Found local pomodoro settings. Attempting migration..."); // Removed for cleaner logs
            const { data: newSupabaseSettings, error: insertError } = await supabase
              .from('pomodoro_settings')
              .insert({
                user_id: session.user.id,
                focus_time: localCustomTimes.focus,
                short_break_time: localCustomTimes['short-break'],
                long_break_time: localCustomTimes['long-break'],
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error migrating local pomodoro settings to Supabase:", insertError);
              toast.error("Error migrating local pomodoro settings.");
              setState(prevState => ({ ...prevState, customTimes: DEFAULT_TIMES, timeLeft: DEFAULT_TIMES.focus }));
            } else if (newSupabaseSettings) {
              settingsIdRef.current = newSupabaseSettings.id;
              setState(prevState => ({
                ...prevState,
                customTimes: {
                  focus: newSupabaseSettings.focus_time,
                  'short-break': newSupabaseSettings.short_break_time,
                  'long-break': newSupabaseSettings.long_break_time,
                },
                timeLeft: prevState.mode === 'focus' ? newSupabaseSettings.focus_time :
                          prevState.mode === 'short-break' ? newSupabaseSettings.short_break_time :
                          newSupabaseSettings.long_break_time,
              }));
              localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY); // Clear local storage after migration
              toast.success("Local pomodoro settings migrated to your account!");
            }
          } else {
            // No settings in Supabase and no local settings, insert defaults
            const { data: newSupabaseSettings, error: insertError } = await supabase
              .from('pomodoro_settings')
              .insert({
                user_id: session.user.id,
                focus_time: DEFAULT_TIMES.focus,
                short_break_time: DEFAULT_TIMES['short-break'],
                long_break_time: DEFAULT_TIMES['long-break'],
              })
              .select()
              .single();
            if (insertError) {
              console.error("Error inserting default pomodoro settings:", insertError);
              toast.error("Error setting up default pomodoro settings.");
            } else if (newSupabaseSettings) {
              settingsIdRef.current = newSupabaseSettings.id;
              setState(prevState => ({
                ...prevState,
                customTimes: {
                  focus: newSupabaseSettings.focus_time,
                  'short-break': newSupabaseSettings.short_break_time,
                  'long-break': newSupabaseSettings.long_break_time,
                },
                timeLeft: prevState.mode === 'focus' ? newSupabaseSettings.focus_time :
                          prevState.mode === 'short-break' ? newSupabaseSettings.short_break_time :
                          newSupabaseSettings.long_break_time,
              }));
            }
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const storedCustomTimesString = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
        let loadedCustomTimes: typeof DEFAULT_TIMES = DEFAULT_TIMES;
        try {
          loadedCustomTimes = storedCustomTimesString ? JSON.parse(storedCustomTimesString) : DEFAULT_TIMES;
        } catch (e) {
          console.error("Error parsing local storage custom times:", e);
          loadedCustomTimes = DEFAULT_TIMES;
        }
        setState(prevState => ({
          ...prevState,
          customTimes: loadedCustomTimes,
          timeLeft: prevState.mode === 'focus' ? loadedCustomTimes.focus :
                    prevState.mode === 'short-break' ? loadedCustomTimes['short-break'] :
                    loadedCustomTimes['long-break'],
        }));
        if (Object.keys(loadedCustomTimes).length === 0) {
          toast.info("You are browsing pomodoro as a guest. Your settings will be saved locally.");
        }
      }
      setLoading(false);
    };

    loadPomodoroSettings();
  }, [session, supabase, authLoading]);

  // Effect to save custom times to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(state.customTimes));
    }
  }, [state.customTimes, isLoggedInMode, loading]);

  const getCurrentModeTime = useCallback(() => {
    return state.customTimes[state.mode];
  }, [state.mode, state.customTimes]);

  const resetTimer = useCallback(async (newMode: PomodoroMode, shouldStopRunning: boolean = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const newTimeLeft = state.customTimes[newMode];

    if (isLoggedInMode && session && supabase && settingsIdRef.current) {
      // Update Supabase if logged in
      const updateData: Partial<SupabasePomodoroSettings> = {
        focus_time: state.customTimes.focus,
        short_break_time: state.customTimes['short-break'],
        long_break_time: state.customTimes['long-break'],
      };
      const { error } = await supabase
        .from('pomodoro_settings')
        .update(updateData)
        .eq('id', settingsIdRef.current)
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error resetting pomodoro settings in Supabase:", error);
        toast.error("Failed to save reset settings to your account.");
      }
    }

    setState(prevState => ({
      ...prevState,
      mode: newMode,
      timeLeft: newTimeLeft,
      isRunning: shouldStopRunning ? false : prevState.isRunning, // Only stop if explicitly told
      isEditingTime: false,
      editableTimeString: '',
    }));
  }, [isLoggedInMode, session, supabase, state.customTimes]);

  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setState(prevState => ({ ...prevState, timeLeft: prevState.timeLeft - 1 }));
      }, 1000);
    } else if (state.timeLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setState(prevState => {
        let nextMode: PomodoroMode;
        if (prevState.mode === 'focus') {
          nextMode = 'short-break';
          toast.success("✨ Focus session complete! Time for a well-deserved break.");
        } else {
          nextMode = 'focus';
          toast.success("Break complete! Time to focus again.");
        }
        return {
          ...prevState,
          mode: nextMode,
          timeLeft: prevState.customTimes[nextMode], // Set to default time for next mode
          isRunning: false, // Crucial: Stop running, user must manually start next session
          isEditingTime: false,
          editableTimeString: '',
        };
      });
    } else if (!state.isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.timeLeft, state.mode, state.customTimes]);

  const handleStartPause = useCallback(() => {
    setState(prevState => {
      const newIsRunning = !prevState.isRunning;
      const newTimeLeft = prevState.timeLeft === 0 ? getCurrentModeTime() : prevState.timeLeft;
      toast.info(newIsRunning ? "Timer started!" : "Timer paused.");
      return { ...prevState, isRunning: newIsRunning, timeLeft: newTimeLeft };
    });
  }, [getCurrentModeTime]);

  const handleReset = useCallback(() => {
    resetTimer(state.mode, true); // Always stop running on explicit reset
    toast.warning("Timer reset.");
  }, [state.mode, resetTimer]);

  const handleSwitchMode = useCallback((newMode: PomodoroMode) => {
    if (state.mode !== newMode) {
      setState(prevState => ({
        ...prevState,
        mode: newMode,
        timeLeft: prevState.customTimes[newMode],
        isEditingTime: false,
        editableTimeString: '',
      }));
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : newMode === 'short-break' ? 'Short Break' : 'Long Break'} mode.`);
    }
  }, [state.mode]);

  const handleTimeDisplayClick = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isEditingTime: true,
      editableTimeString: formatTime(prevState.timeLeft),
    }));
  }, []);

  const handleTimeInputBlur = useCallback(async () => { // Made async to await Supabase call
    setState(prevState => {
      const newTime = parseTimeToSeconds(prevState.editableTimeString);
      if (!isNaN(newTime) && newTime >= 0) {
        const updatedCustomTimes = { ...prevState.customTimes, [prevState.mode]: newTime };

        // Save to Supabase if logged in
        if (isLoggedInMode && session && supabase && settingsIdRef.current) {
          const updateData: Partial<SupabasePomodoroSettings> = {
            focus_time: updatedCustomTimes.focus,
            short_break_time: updatedCustomTimes['short-break'],
            long_break_time: updatedCustomTimes['long-break'],
          };
          supabase
            .from('pomodoro_settings')
            .update(updateData)
            .eq('id', settingsIdRef.current)
            .eq('user_id', session.user.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error updating pomodoro settings in Supabase:", error);
                toast.error("Failed to save settings to your account.");
              } else {
                toast.success("Timer time updated and saved to your account!");
              }
            });
        } else if (!isLoggedInMode) {
          // Save to local storage if guest
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(updatedCustomTimes));
          toast.success("Timer time updated and saved locally!");
        }

        return {
          ...prevState,
          customTimes: updatedCustomTimes,
          timeLeft: newTime,
          isEditingTime: false,
        };
      } else {
        toast.error("Invalid time format. Please use HH:MM:SS.");
        return {
          ...prevState,
          timeLeft: prevState.customTimes[prevState.mode], // Revert to current mode's default if invalid
          isEditingTime: false,
        };
      }
    });
  }, [isLoggedInMode, session, supabase]);

  const setEditableTimeString = useCallback((value: string) => {
    setState(prevState => ({ ...prevState, editableTimeString: value }));
  }, []);

  // New function to update custom times from settings modal
  const setCustomTime = useCallback(async (mode: PomodoroMode, newTimeInSeconds: number) => {
    setState(prevState => {
      const updatedCustomTimes = {
        ...prevState.customTimes,
        [mode]: newTimeInSeconds,
      };
      // If the current mode's time is being updated, also update timeLeft
      const newTimeLeft = prevState.mode === mode ? newTimeInSeconds : prevState.timeLeft;

      // Save to Supabase if logged in
      if (isLoggedInMode && session && supabase && settingsIdRef.current) {
        const updateData: Partial<SupabasePomodoroSettings> = {
          focus_time: updatedCustomTimes.focus,
          short_break_time: updatedCustomTimes['short-break'],
          long_break_time: updatedCustomTimes['long-break'],
        };
        supabase
          .from('pomodoro_settings')
          .update(updateData)
          .eq('id', settingsIdRef.current)
          .eq('user_id', session.user.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating pomodoro settings in Supabase:", error);
              toast.error("Failed to save settings to your account.");
            } else {
              toast.success("Pomodoro settings saved to your account!");
            }
          });
      } else if (!isLoggedInMode) {
        // Save to local storage if guest
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(updatedCustomTimes));
        toast.success("Pomodoro settings saved locally!");
      }

      return {
        ...prevState,
        customTimes: updatedCustomTimes,
        timeLeft: newTimeLeft,
      };
    });
  }, [isLoggedInMode, session, supabase]);

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
    setCustomTime, // Expose the new function
    loading: loading, // Expose loading state
  };
}