"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { PomodoroMode } from "@/lib/pomodoro-utils"; // Updated import path

const DEFAULT_TIMES = {
  'focus': 30 * 60, // 30 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
};

const LOCAL_STORAGE_CUSTOM_TIMES_KEY = 'pomodoro_custom_times';

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

export function usePomodoroSettings() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [customTimes, setCustomTimesState] = useState(DEFAULT_TIMES);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const settingsIdRef = useRef<string | null>(null);

  const fetchAndSetSettings = useCallback(async () => {
    setLoadingSettings(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      
      let fetchedSettings: SupabasePomodoroSettings | null = null;

      if (currentRoomId) {
        const { data, error } = await supabase
          .from('pomodoro_settings')
          .select('*')
          .eq('room_id', currentRoomId)
          .eq('user_id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching pomodoro settings for room:", error);
          toast.error("Failed to load pomodoro settings for this room.");
        } else if (data) {
          fetchedSettings = data as SupabasePomodoroSettings;
        }
      } else {
        const { data, error } = await supabase
          .from('pomodoro_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .is('room_id', null)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching personal pomodoro settings:", error);
          toast.error("Failed to load personal pomodoro settings.");
        } else if (data) {
          fetchedSettings = data as SupabasePomodoroSettings;
        }
      }

      if (fetchedSettings) {
        settingsIdRef.current = fetchedSettings.id;
        setCustomTimesState({
          focus: fetchedSettings.focus_time,
          'short-break': fetchedSettings.short_break_time,
          'long-break': fetchedSettings.long_break_time,
        });
      } else {
        // No settings found in Supabase for current context, check local storage for migration (only for personal)
        if (!currentRoomId) {
          const localCustomTimesString = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
          let localCustomTimes: typeof DEFAULT_TIMES = DEFAULT_TIMES;
          try {
            localCustomTimes = localCustomTimesString ? JSON.parse(localCustomTimesString) : DEFAULT_TIMES;
          } catch (e) {
            console.error("Error parsing local storage custom times:", e);
            localCustomTimes = DEFAULT_TIMES;
          }

          if (localCustomTimes !== DEFAULT_TIMES) {
            const { data: newSupabaseSettings, error: insertError } = await supabase
              .from('pomodoro_settings')
              .insert({
                user_id: session.user.id,
                room_id: null,
                focus_time: localCustomTimes.focus,
                short_break_time: localCustomTimes['short-break'],
                long_break_time: localCustomTimes['long-break'],
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error migrating local pomodoro settings to Supabase:", insertError);
              toast.error("Error migrating local pomodoro settings.");
              setCustomTimesState(DEFAULT_TIMES);
            } else if (newSupabaseSettings) {
              settingsIdRef.current = newSupabaseSettings.id;
              setCustomTimesState({
                focus: newSupabaseSettings.focus_time,
                'short-break': newSupabaseSettings.short_break_time,
                'long-break': newSupabaseSettings.long_break_time,
              });
              localStorage.removeItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
              toast.success("Local pomodoro settings migrated to your account!");
            }
          } else {
            // No settings in Supabase and no local settings, insert defaults
            const { data: newSupabaseSettings, error: insertError } = await supabase
              .from('pomodoro_settings')
              .insert({
                user_id: session.user.id,
                room_id: null,
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
              setCustomTimesState({
                focus: newSupabaseSettings.focus_time,
                'short-break': newSupabaseSettings.short_break_time,
                'long-break': newSupabaseSettings.long_break_time,
              });
            }
          }
        } else { // currentRoomId is set, but no settings found for this user in this room
          // Insert default settings for this user in this room
          const { data: newSupabaseSettings, error: insertError } = await supabase
            .from('pomodoro_settings')
            .insert({
              user_id: session.user.id,
              room_id: currentRoomId,
              focus_time: DEFAULT_TIMES.focus,
              short_break_time: DEFAULT_TIMES['short-break'],
              long_break_time: DEFAULT_TIMES['long-break'],
            })
            .select()
            .single();
          if (insertError) {
            console.error("Error inserting default room pomodoro settings:", insertError);
            toast.error("Error setting up default pomodoro settings for this room.");
          } else if (newSupabaseSettings) {
            settingsIdRef.current = newSupabaseSettings.id;
            setCustomTimesState({
              focus: newSupabaseSettings.focus_time,
              'short-break': newSupabaseSettings.short_break_time,
              'long-break': newSupabaseSettings.long_break_time,
            });
          }
        }
      }
    } else {
      setIsLoggedInMode(false);
      const storedCustomTimesString = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY);
      let loadedCustomTimes: typeof DEFAULT_TIMES = DEFAULT_TIMES;
      try {
        loadedCustomTimes = storedCustomTimesString ? JSON.parse(storedCustomTimesString) : DEFAULT_TIMES;
      } catch (e) {
        console.error("Error parsing local storage custom times:", e);
        loadedCustomTimes = DEFAULT_TIMES;
      }
      setCustomTimesState(loadedCustomTimes);
      if (Object.keys(loadedCustomTimes).length === 0) {
        toast.info("You are browsing pomodoro as a guest. Your settings will be saved locally.");
      }
    }
    setLoadingSettings(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    fetchAndSetSettings();
  }, [fetchAndSetSettings]);

  // Effect to save custom times to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loadingSettings) {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(customTimes));
    }
  }, [customTimes, isLoggedInMode, loadingSettings]);

  const setCustomTime = useCallback(async (mode: PomodoroMode, newTimeInSeconds: number) => {
    const updatedCustomTimes = {
      ...customTimes,
      [mode]: newTimeInSeconds,
    };
    setCustomTimesState(updatedCustomTimes);

    if (isLoggedInMode && session && supabase && settingsIdRef.current) {
      const updateData: Partial<SupabasePomodoroSettings> = {
        focus_time: updatedCustomTimes.focus,
        short_break_time: updatedCustomTimes['short-break'],
        long_break_time: updatedCustomTimes['long-break'],
      };
      const { error } = await supabase
        .from('pomodoro_settings')
        .update(updateData)
        .eq('id', settingsIdRef.current)
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error updating pomodoro settings in Supabase:", error);
        toast.error("Failed to save settings to your account.");
      } else {
        toast.success("Pomodoro settings saved to your account!");
      }
    } else if (!isLoggedInMode) {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TIMES_KEY, JSON.stringify(updatedCustomTimes));
      toast.success("Pomodoro settings saved locally!");
    }
  }, [customTimes, isLoggedInMode, session, supabase]);

  return {
    customTimes,
    setCustomTime,
    loadingSettings,
    isLoggedInMode,
    settingsIdRef, // Expose ref for direct Supabase interaction if needed
    DEFAULT_TIMES,
  };
}