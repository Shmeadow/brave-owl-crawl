"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface AppSettings {
  id: string;
  primary_color_hsl: string;
  primary_foreground_hsl: string;
  secondary_color_hsl: string;
  secondary_foreground_hsl: string;
  foreground_hsl: string;
  pomodoro_transparency: number;
  is_cozy_theme_enabled: boolean; // New setting
}

export function useAppSettings() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single();

    if (error) {
      console.error("Error fetching app settings:", error);
      toast.error("Failed to load app settings.");
      setSettings(null);
    } else {
      setSettings(data as AppSettings);
      // console.log("Loaded app settings from Supabase."); // Removed for cleaner logs
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;

    // Check admin status
    const userRole = session?.user?.user_metadata?.role;
    setIsAdmin(userRole === 'admin');

    fetchSettings();
  }, [session, authLoading, fetchSettings]);

  const updateSetting = useCallback(async (key: keyof AppSettings, value: any) => {
    if (!supabase || !isAdmin) {
      toast.error("You do not have permission to update settings.");
      return;
    }

    if (!settings) {
      toast.error("App settings not loaded.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .update({ [key]: value })
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      toast.error(`Error updating setting: ${error.message}`);
      console.error(`Error updating ${String(key)}:`, error);
    } else if (data) {
      setSettings(data as AppSettings);
      // toast.success(`Setting "${String(key)}" updated successfully!`);
    }
    setLoading(false);
  }, [supabase, isAdmin, settings]);

  return {
    settings,
    loading,
    isAdmin,
    updateSetting,
    fetchSettings, // Expose fetch for re-fetching if needed
  };
}