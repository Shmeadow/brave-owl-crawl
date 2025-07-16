"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useUserPreferences } from '@/hooks/use-user-preferences'; // Import the new user preferences hook

interface BackgroundBlurContextType {
  blur: number; // 0 to 16 (pixels)
  setBlur: (value: number) => void;
}

const BackgroundBlurContext = createContext<BackgroundBlurContextType | undefined>(undefined);

export function BackgroundBlurProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreference } = useUserPreferences();

  const blur = preferences?.background_blur ?? 4; // Default to 4px if not loaded or null

  const setBlur = (value: number) => {
    updatePreference('background_blur', value);
  };

  const value = useMemo(() => ({ blur, setBlur }), [blur, setBlur]);

  return (
    <BackgroundBlurContext.Provider value={value}>
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