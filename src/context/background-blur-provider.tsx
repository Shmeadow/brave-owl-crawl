"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { usePersistentData } from '@/hooks/use-persistent-data'; // Import the new hook

interface BackgroundBlurContextType {
  blur: number; // 0 to 16 (pixels)
  setBlur: (value: number) => void;
}

const BackgroundBlurContext = createContext<BackgroundBlurContextType | undefined>(undefined);

interface DbUserPreference {
  user_id: string;
  background_blur: number;
}

const LOCAL_STORAGE_KEY = 'app_background_blur';
const SUPABASE_TABLE_NAME = 'user_preferences';

export function BackgroundBlurProvider({ children }: { children: React.ReactNode }) {
  const {
    data: blur,
    loading,
    isLoggedInMode,
    setData: setBlurState,
    fetchData,
  } = usePersistentData<number, DbUserPreference>({
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: 4, // Default to 4px blur
    selectQuery: 'background_blur',
    transformFromDb: (dbData: DbUserPreference) => dbData.background_blur ?? 4,
    transformToDb: (appData: number, userId: string) => ({
      user_id: userId,
      background_blur: appData,
    }),
    onConflictColumn: 'user_id',
    isSingleton: true,
    debounceDelay: 500,
  });

  // Apply blur to CSS variable whenever it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--background-blur-px', `${blur}px`);
  }, [blur]);

  const setBlur = useCallback((value: number) => {
    setBlurState(value);
  }, [setBlurState]);

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