"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export type FlashcardSize = 'S' | 'M' | 'L';

const LOCAL_STORAGE_KEY = 'flashcard_size_preference';

export function useFlashcardSize() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [size, setSize] = useState<FlashcardSize>('M');
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to load preference
  useEffect(() => {
    if (authLoading) return;

    const loadPreference = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('flashcard_size')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching flashcard size preference:", error);
        } else if (data && data.flashcard_size) {
          setSize(data.flashcard_size as FlashcardSize);
        } else {
          // No preference in DB, check local storage for migration
          const localSize = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localSize && ['S', 'M', 'L'].includes(localSize)) {
            setSize(localSize as FlashcardSize);
            // Migrate to DB
            await supabase.from('user_preferences').upsert({ user_id: session.user.id, flashcard_size: localSize }, { onConflict: 'user_id' });
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } else {
            // No preference anywhere, use default 'M'
            setSize('M');
          }
        }
      } else {
        // Guest mode
        setIsLoggedInMode(false);
        const localSize = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localSize && ['S', 'M', 'L'].includes(localSize)) {
          setSize(localSize as FlashcardSize);
        } else {
          setSize('M');
        }
      }
      setLoading(false);
    };

    loadPreference();
  }, [session, supabase, authLoading]);

  const updateSize = useCallback(async (newSize: FlashcardSize) => {
    setSize(newSize);
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: session.user.id, flashcard_size: newSize }, { onConflict: 'user_id' });
      if (error) {
        toast.error("Failed to save size preference.");
        console.error("Error updating flashcard size:", error);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, newSize);
    }
  }, [isLoggedInMode, session, supabase]);

  return { size, setSize: updateSize, loading };
}