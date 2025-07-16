"use client";

import { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { useSupabase } from '@/integrations/supabase/auth';
import { useCurrentRoom } from './use-current-room';
import { toast } from 'sonner';

// Define the FlashcardSize type here
export type FlashcardSize = 'sm' | 'md' | 'lg';

const DEFAULT_SIZE: FlashcardSize = 'md'; // Default to medium
const LOCAL_STORAGE_KEY = 'flashcard_size_preference';

interface SupabaseFlashcardSettings {
  id: string;
  user_id: string;
  room_id: string | null;
  flashcard_size: FlashcardSize;
  created_at: string;
  updated_at: string;
}

export function useFlashcardSize() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [size, setSizeState] = useState<FlashcardSize>(DEFAULT_SIZE);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const settingsIdRef = useRef<string | null>(null); // Corrected to useRef

  const loadSizePreference = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      const query = supabase.from('flashcard_settings').select('*');
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }
      const { data: supabaseSettings, error: fetchError } = await query.single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        toast.error("Error fetching flashcard size settings: " + fetchError.message);
        setSizeState(DEFAULT_SIZE);
      } else if (supabaseSettings) {
        settingsIdRef.current = supabaseSettings.id;
        setSizeState(supabaseSettings.flashcard_size as FlashcardSize);
      } else {
        // No settings found for this context, use defaults. A new record will be created on save.
        settingsIdRef.current = null;
        setSizeState(DEFAULT_SIZE);
      }
    } else {
      setIsLoggedInMode(false);
      const storedSize = localStorage.getItem(LOCAL_STORAGE_KEY);
      setSizeState((storedSize as FlashcardSize) || DEFAULT_SIZE);
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    loadSizePreference();
  }, [loadSizePreference]);

  const saveSizePreference = useCallback(async (newSize: FlashcardSize) => {
    if (isLoggedInMode && session && supabase) {
      const record = {
        user_id: session.user.id,
        room_id: currentRoomId,
        flashcard_size: newSize,
      };
      const { data, error } = await supabase.from('flashcard_settings').upsert(record, { onConflict: 'user_id,room_id' }).select().single();
      if (error) {
        toast.error("Failed to save flashcard size: " + error.message);
      } else if (data) {
        settingsIdRef.current = data.id;
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, newSize);
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const setSize = useCallback((newSize: FlashcardSize) => {
    setSizeState(newSize);
    saveSizePreference(newSize);
  }, [saveSizePreference]);

  return { size, setSize, loading };
}