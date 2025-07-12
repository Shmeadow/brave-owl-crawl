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
  is_cozy_theme_enabled: boolean;
}

export function useAppSettings() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();
      if (error) throw error;
      setSettings(data as AppSettings);
    } catch (error: any) {
      toast.error("Failed to load app settings: " + error.message);
      console.error("Error fetching app settings:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!authLoading) {
      setIsAdmin(session?.user?.user_metadata?.role === 'admin');
      fetchSettings();
    }
  }, [session, authLoading, fetchSettings]);

  const updateSetting = useCallback(async (key: keyof AppSettings, value: any) => {
    if (!supabase || !isAdmin || !settings) {
      toast.error("Permission denied or settings not loaded.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ [key]: value })
        .eq('id', settings.id)
        .select()
        .single();
      if (error) throw error;
      setSettings(data as AppSettings);
      toast.success(`Setting "${String(key)}" updated successfully!`);
    } catch (error: any) {
      toast.error(`Error updating setting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, isAdmin, settings]);

  return { settings, loading, isAdmin, updateSetting, fetchSettings };
}