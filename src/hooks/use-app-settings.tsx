"use client";

import { useState, useEffect, useCallback } => 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { usePersistentData } from './use-persistent-data'; // Import the new hook

export interface AppSettings {
  id: string;
  primary_color_hsl: string;
  primary_foreground_hsl: string;
  secondary_color_hsl: string;
  secondary_foreground_hsl: string;
  foreground_hsl: string;
  pomodoro_transparency: number;
  is_cozy_theme_enabled: boolean;
}

interface DbAppSettings {
  id: string;
  primary_color_hsl: string;
  primary_foreground_hsl: string;
  secondary_color_hsl: string;
  secondary_foreground_hsl: string;
  foreground_hsl: string;
  pomodoro_transparency: number;
  is_cozy_theme_enabled: boolean;
}

const SUPABASE_TABLE_NAME = 'app_settings';
const APP_SETTINGS_ID = 'a_fixed_id_for_singleton_settings'; // A placeholder ID for the single row

export function useAppSettings() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    data: settings,
    loading,
    isLoggedInMode, // Not directly used for app settings, but good to have
    setData: setSettings,
    fetchData,
  } = usePersistentData<AppSettings, DbAppSettings>({ // T_APP_DATA is AppSettings, T_DB_DATA_ITEM is DbAppSettings
    localStorageKey: 'app_settings_local_cache', // Use a local cache key, as these are global settings
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: { // Default values if no settings are found
      id: APP_SETTINGS_ID,
      primary_color_hsl: '0 0% 9%',
      primary_foreground_hsl: '0 0% 98%',
      secondary_color_hsl: '0 0% 96.1%',
      secondary_foreground_hsl: '0 0% 9%',
      foreground_hsl: '0 0% 3.9%',
      pomodoro_transparency: 0.5,
      is_cozy_theme_enabled: true,
    },
    selectQuery: '*',
    transformFromDb: (dbData: DbAppSettings) => ({
      id: dbData.id,
      primary_color_hsl: dbData.primary_color_hsl,
      primary_foreground_hsl: dbData.primary_foreground_hsl,
      secondary_color_hsl: dbData.secondary_color_hsl,
      secondary_foreground_hsl: dbData.secondary_foreground_hsl,
      foreground_hsl: dbData.foreground_hsl,
      pomodoro_transparency: dbData.pomodoro_transparency,
      is_cozy_theme_enabled: dbData.is_cozy_theme_enabled,
    }),
    transformToDb: (appData: AppSettings, userId: string) => ({ // appItem is AppSettings, returns DbAppSettings
      id: appData.id,
      primary_color_hsl: appData.primary_color_hsl,
      primary_foreground_hsl: appData.primary_foreground_hsl,
      secondary_color_hsl: appData.secondary_color_hsl,
      secondary_foreground_hsl: appData.secondary_foreground_hsl,
      foreground_hsl: appData.foreground_hsl,
      pomodoro_transparency: appData.pomodoro_transparency,
      is_cozy_theme_enabled: appData.is_cozy_theme_enabled,
    }),
    onConflictColumn: 'id', // Conflict on 'id' since it's a singleton table
    isSingleton: true,
    userIdColumn: undefined, // Changed from null to undefined
  });

  useEffect(() => {
    if (authLoading) return;
    const userRole = session?.user?.user_metadata?.role;
    setIsAdmin(userRole === 'admin');
  }, [session, authLoading]);

  const updateSetting = useCallback(async (key: keyof AppSettings, value: any) => {
    if (!supabase || !isAdmin || !settings) {
      toast.error("You do not have permission to update settings.");
      return;
    }

    const updatedSettings = { ...settings, [key]: value };

    const { data, error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .update({ [key]: value })
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      toast.error(`Error updating setting: ${error.message}`);
      console.error(`Error updating ${String(key)}:`, error);
    } else if (data) {
      setSettings(updatedSettings); // Update local state immediately
      toast.success(`Setting "${String(key)}" updated successfully!`);
    }
  }, [supabase, isAdmin, settings, setSettings]);

  return {
    settings,
    loading,
    isAdmin,
    updateSetting,
    fetchSettings: fetchData,
  };
}