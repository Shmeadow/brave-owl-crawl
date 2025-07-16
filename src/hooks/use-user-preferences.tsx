"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from '@/context/toast-visibility-provider'; // Use the new custom toast

export type EffectType = 'none' | 'rain' | 'snow' | 'raindrops';
export type FlashcardSize = 'sm' | 'md' | 'lg';

export interface UserPreferencesData {
  id: string;
  user_id: string;
  background_url: string | null;
  is_video_background: boolean | null;
  is_mirrored_background: boolean | null;
  active_effect: EffectType | null;
  is_sidebar_always_open: boolean | null;
  background_blur: number | null;
  flashcard_size: FlashcardSize | null;
  hide_toasts: boolean | null; // New preference
  created_at: string;
  updated_at: string;
}

// Default values for preferences
const DEFAULT_PREFERENCES: Omit<UserPreferencesData, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  background_url: null,
  is_video_background: false,
  is_mirrored_background: false,
  active_effect: 'none',
  is_sidebar_always_open: false,
  background_blur: 4,
  flashcard_size: 'md',
  hide_toasts: true, // Default to hiding toasts
};

// Local storage keys for guest mode
const LOCAL_STORAGE_KEYS = {
  background_url: 'app_background_url',
  is_video_background: 'app_background_type', // Stores 'video' or 'image'
  is_mirrored_background: 'app_background_mirrored',
  active_effect: 'app_active_effect',
  is_sidebar_always_open: 'sidebar_always_open',
  background_blur: 'app_background_blur',
  flashcard_size: 'flashcard_size_preference',
  hide_toasts: 'hide_toasts_preference', // New local storage key
};

const DEBOUNCE_DELAY = 500; // milliseconds for saving to Supabase

export function useUserPreferences() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      // Try to fetch from Supabase
      const { data: supabasePrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching user preferences from Supabase:", fetchError);
        toast.error("Failed to load user preferences.");
      }

      if (supabasePrefs) {
        setPreferences(supabasePrefs as UserPreferencesData);
      } else {
        // No Supabase data, check local storage for migration
        const localPrefs: Partial<UserPreferencesData> = {};
        let shouldMigrate = false;

        // Background
        const savedBgUrl = localStorage.getItem(LOCAL_STORAGE_KEYS.background_url);
        const savedBgType = localStorage.getItem(LOCAL_STORAGE_KEYS.is_video_background);
        const savedBgMirrored = localStorage.getItem(LOCAL_STORAGE_KEYS.is_mirrored_background);
        if (savedBgUrl) {
          localPrefs.background_url = savedBgUrl;
          localPrefs.is_video_background = savedBgType === 'video';
          localPrefs.is_mirrored_background = savedBgMirrored === 'true';
          shouldMigrate = true;
        }

        // Effect
        const savedEffect = localStorage.getItem(LOCAL_STORAGE_KEYS.active_effect);
        if (savedEffect && ['none', 'rain', 'snow', 'raindrops'].includes(savedEffect)) {
          localPrefs.active_effect = savedEffect as EffectType;
          shouldMigrate = true;
        }

        // Sidebar
        const savedSidebarPref = localStorage.getItem(LOCAL_STORAGE_KEYS.is_sidebar_always_open);
        if (savedSidebarPref !== null) {
          localPrefs.is_sidebar_always_open = savedSidebarPref === 'true';
          shouldMigrate = true;
        }

        // Blur
        const savedBlur = localStorage.getItem(LOCAL_STORAGE_KEYS.background_blur);
        if (savedBlur !== null) {
          const parsedBlur = parseInt(savedBlur, 10);
          if (!isNaN(parsedBlur)) {
            localPrefs.background_blur = parsedBlur;
            shouldMigrate = true;
          }
        }

        // Flashcard Size
        const savedFlashcardSize = localStorage.getItem(LOCAL_STORAGE_KEYS.flashcard_size);
        if (savedFlashcardSize && ['sm', 'md', 'lg'].includes(savedFlashcardSize)) {
          localPrefs.flashcard_size = savedFlashcardSize as FlashcardSize;
          shouldMigrate = true;
        }

        // Hide Toasts (new)
        const savedHideToasts = localStorage.getItem(LOCAL_STORAGE_KEYS.hide_toasts);
        if (savedHideToasts !== null) {
          localPrefs.hide_toasts = savedHideToasts === 'true';
          shouldMigrate = true;
        }

        const mergedPrefs = { ...DEFAULT_PREFERENCES, ...localPrefs };

        // Insert/Upsert into Supabase
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .upsert({ user_id: session.user.id, ...mergedPrefs }, { onConflict: 'user_id' })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting/migrating default preferences into Supabase:", insertError);
          setPreferences({ ...DEFAULT_PREFERENCES, user_id: session.user.id, id: 'temp', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); // Fallback to default
        } else if (newPrefs) {
          setPreferences(newPrefs as UserPreferencesData);
          if (shouldMigrate) {
            // Clear local storage items after successful migration
            Object.values(LOCAL_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
            toast.info("Local settings migrated to your account!");
          }
        }
      }
    } else {
      // User is a guest (not logged in)
      setIsLoggedInMode(false);
      const guestPrefs: Partial<UserPreferencesData> = {};

      // Load from local storage for guest mode
      Object.entries(LOCAL_STORAGE_KEYS).forEach(([key, lsKey]) => {
        const value = localStorage.getItem(lsKey);
        if (value !== null) {
          if (key === 'is_video_background') guestPrefs[key] = value === 'video';
          else if (key === 'is_mirrored_background' || key === 'is_sidebar_always_open' || key === 'hide_toasts') guestPrefs[key] = value === 'true';
          else if (key === 'background_blur') guestPrefs[key] = parseInt(value, 10);
          else if (key === 'active_effect') guestPrefs[key] = value as EffectType;
          else if (key === 'flashcard_size') guestPrefs[key] = value as FlashcardSize;
          else guestPrefs[key] = value;
        }
      });
      setPreferences({ ...DEFAULT_PREFERENCES, ...guestPrefs, user_id: 'guest', id: 'guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setLoading(false);
  }, [session, supabase, authLoading]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Apply CSS variables for background blur and theme
  useEffect(() => {
    if (preferences) {
      document.documentElement.style.setProperty('--background-blur-px', `${preferences.background_blur ?? 4}px`);
      // Note: Theme is handled by next-themes and ThemeProvider, not directly here.
    }
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof Omit<UserPreferencesData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>(key: K, value: UserPreferencesData[K]) => {
    setPreferences(prev => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (isLoggedInMode && session && supabase) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({ user_id: session.user.id, [key]: value }, { onConflict: 'user_id' });

        if (error) {
          console.error(`Error updating preference ${String(key)} in Supabase:`, error);
          toast.error(`Failed to save ${String(key)} preference.`);
        } else {
          // toast.success(`${String(key)} preference saved!`); // Removed for cleaner logs
        }
      } else if (!loading) {
        // Save to local storage for guest mode
        let lsValue: string;
        if (typeof value === 'boolean') lsValue = String(value);
        else if (typeof value === 'number') lsValue = String(value);
        else if (key === 'is_video_background') lsValue = value ? 'video' : 'image'; // Special handling for background type
        else lsValue = value as string;
        localStorage.setItem(LOCAL_STORAGE_KEYS[key as keyof typeof LOCAL_STORAGE_KEYS], lsValue);
        // toast.success(`${String(key)} preference saved locally!`); // Removed for cleaner logs
      }
    }, DEBOUNCE_DELAY);
  }, [isLoggedInMode, session, supabase, loading]);

  return {
    preferences,
    loading,
    isLoggedInMode,
    updatePreference,
    fetchPreferences, // Expose for manual refresh if needed
  };
}