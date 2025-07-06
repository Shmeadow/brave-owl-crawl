"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

interface BackgroundBlurContextType {
  blur: number; // 0 to 16 (pixels)
  setBlur: (value: number) => void;
}

const BackgroundBlurContext = createContext<BackgroundBlurContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_background_blur';

export function BackgroundBlurProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [blur, setBlurState] = useState(4); // Default to 4px blur
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to load blur setting
  useEffect(() => {
    if (authLoading) return;

    const loadBlur = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        // 1. Try to fetch from Supabase
        const { data: supabasePrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('background_blur')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching blur preferences from Supabase:", fetchError);
          toast.error("Failed to load blur preferences.");
        }

        if (supabasePrefs && supabasePrefs.background_blur !== null) {
          setBlurState(supabasePrefs.background_blur);
          console.log("Loaded background blur from Supabase.");
        } else {
          // 2. If no Supabase data, check local storage for migration
          const savedBlur = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedBlur !== null) {
            const parsedBlur = parseInt(savedBlur, 10);
            if (!isNaN(parsedBlur)) {
              // Migrate to Supabase
              const { error: insertError } = await supabase
                .from('user_preferences')
                .upsert({ user_id: session.user.id, background_blur: parsedBlur }, { onConflict: 'user_id' });

              if (insertError) {
                console.error("Error migrating local blur to Supabase:", insertError);
                toast.error("Error migrating local blur settings.");
              } else {
                setBlurState(parsedBlur);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                toast.success("Local blur settings migrated to your account!");
              }
            }
          } else {
            // 3. If neither, set default and insert into Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, background_blur: 4 }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error inserting default blur into Supabase:", insertError);
            } else {
              setBlurState(4);
            }
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const savedBlur = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedBlur !== null) {
          const parsedBlur = parseInt(savedBlur, 10);
          if (!isNaN(parsedBlur)) {
            setBlurState(parsedBlur);
          }
        } else {
          // Set default for guests if no local storage
          setBlurState(4);
          localStorage.setItem(LOCAL_STORAGE_KEY, '4');
        }
      }
      setLoading(false);
    };

    loadBlur();
  }, [session, supabase, authLoading]);

  const setBlur = useCallback(async (value: number) => {
    setBlurState(value);
    document.documentElement.style.setProperty('--background-blur-px', `${value}px`);

    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: session.user.id, background_blur: value }, { onConflict: 'user_id' });

      if (error) {
        console.error("Error updating blur in Supabase:", error);
        toast.error("Failed to save blur preference.");
      } else {
        toast.success("Blur setting saved to your account!");
      }
    } else if (!loading) { // Only save to local storage if not logged in and initial load is complete
      localStorage.setItem(LOCAL_STORAGE_KEY, value.toString());
      toast.success("Blur setting saved locally!");
    }
  }, [isLoggedInMode, session, supabase, loading]);

  return (
    <BackgroundBlurContext.Provider value={{ blur, setBlur }}>
      {children}
    </BackgroundBlurContext.Provider>
  );
}

export const useBackgroundBlur = () => {
  const context = useContext(BackgroundBlurContext);
  if (context === undefined) {
    throw new Error('useBackgroundBlur must be used within a BackgroundBlurProvider');
  }
  return context;
};