"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

interface SidebarPreferenceContextType {
  isAlwaysOpen: boolean;
  toggleAlwaysOpen: () => void;
}

const LOCAL_STORAGE_KEY = 'app_sidebar_always_open';

export function useSidebarPreference(): SidebarPreferenceContextType {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [isAlwaysOpen, setIsAlwaysOpenState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const loadPreference = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        const { data: supabasePrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('is_sidebar_always_open')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching sidebar preferences:", fetchError);
        }

        if (supabasePrefs && supabasePrefs.is_sidebar_always_open !== null) {
          setIsAlwaysOpenState(supabasePrefs.is_sidebar_always_open);
        } else {
          const savedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedPreference !== null) {
            const parsedPreference = savedPreference === 'true';
            await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, is_sidebar_always_open: parsedPreference }, { onConflict: 'user_id' });
            setIsAlwaysOpenState(parsedPreference);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } else {
            await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, is_sidebar_always_open: false }, { onConflict: 'user_id' });
            setIsAlwaysOpenState(false);
          }
        }
      } else {
        setIsLoggedInMode(false);
        const savedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
        setIsAlwaysOpenState(savedPreference === 'true');
      }
      setLoading(false);
    };

    loadPreference();
  }, [session, supabase, authLoading]);

  const toggleAlwaysOpen = useCallback(async () => {
    const newPreference = !isAlwaysOpen;
    setIsAlwaysOpenState(newPreference);

    if (isLoggedInMode && session && supabase) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: session.user.id, is_sidebar_always_open: newPreference }, { onConflict: 'user_id' });
    } else if (!loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(newPreference));
    }
  }, [isAlwaysOpen, isLoggedInMode, session, supabase, loading]);

  return { isAlwaysOpen, toggleAlwaysOpen };
}