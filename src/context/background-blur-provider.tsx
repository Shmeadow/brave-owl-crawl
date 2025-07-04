"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BackgroundBlurContextType {
  blur: number; // 0 to 16 (pixels)
  setBlur: (value: number) => void;
}

const BackgroundBlurContext = createContext<BackgroundBlurContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_background_blur';

export function BackgroundBlurProvider({ children }: { children: React.ReactNode }) {
  // Always default to 4px blur (25% of max 16) on initial render
  const [blur, setBlurState] = useState(4); 

  // Update CSS variable and local storage when blur changes
  useEffect(() => {
    document.documentElement.style.setProperty('--background-blur-px', `${blur}px`);
    // Keep saving to local storage so changes persist within the same session
    localStorage.setItem(LOCAL_STORAGE_KEY, blur.toString());
  }, [blur]);

  const setBlur = useCallback((value: number) => {
    setBlurState(value);
  }, []);

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