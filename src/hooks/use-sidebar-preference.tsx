"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

const LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY = 'sidebar_always_open';

export function useSidebarPreference() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [isAlwaysOpen, setIsAlwaysOpenState] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to load sidebar preference
  useEffect(() => {
    if (authLoading || !mounted) return;

    const loadPreference = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        // 1. Try to fetch from Supabase
        const { data: supabasePrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('is_sidebar_always_open')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching sidebar preference from Supabase:", fetchError);
          toast.error("Failed to load sidebar preference.");
        }

        if (supabasePrefs && supabasePrefs.is_sidebar_always_open !== null) {
          setIsAlwaysOpenState(supabasePrefs.is_sidebar_always_open);
          console.log("Loaded sidebar preference from Supabase.");
        } else {
          // 2. If no Supabase data, check local storage for migration
          const savedPreference = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY);
          if (savedPreference !== null) {
            const parsedPreference = savedPreference === 'true';
            // Migrate to Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, is_sidebar_always_open: parsedPreference }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error migrating local sidebar preference to Supabase:", insertError);
              toast.error("Error migrating local sidebar settings.");
            } else {
              setIsAlwaysOpenState(parsedPreference);
              localStorage.removeItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY);
              toast.success("Local sidebar settings migrated to your account!");
            }
          } else {
            // 3. If neither, set default and insert into Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, is_sidebar_always_open: false }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error inserting default sidebar preference into Supabase:", insertError);
            } else {
              setIsAlwaysOpenState(false);
            }
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const savedPreference = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY);
        if (savedPreference !== null) {
          setIsAlwaysOpenState(savedPreference === 'true');
        } else {
          // Set default for guests if no local storage
          setIsAlwaysOpenState(false);
          localStorage.setItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY, 'false');
        }
      }
      setLoading(false);
    };

    loadPreference();
  }, [session, supabase, authLoading, mounted]);

  const toggleAlwaysOpen = useCallback(async () => {
    setIsAlwaysOpenState(prev => {
      const newPreference = !prev;
      if (isLoggedInMode && session && supabase) {
        supabase
          .from('user_preferences')
          .upsert({ user_id: session.user.id, is_sidebar_always_open: newPreference }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) {
              console.error("Error updating sidebar preference in Supabase:", error);
              toast.error("Failed to save sidebar preference.");
            } else {
              toast.success("Sidebar preference saved to your account!");
            }
          });
      } else if (mounted && !loading) { // Only save to local storage if not logged in and initial load is complete
        localStorage.setItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY, String(newPreference));
        toast.success("Sidebar preference saved locally!");
      }
      return newPreference;
    });
  }, [isLoggedInMode, session, supabase, mounted, loading]);

  return { isAlwaysOpen, toggleAlwaysOpen, mounted, loading };
}