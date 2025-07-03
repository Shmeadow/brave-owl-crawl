"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface GlassEffectContextType {
  glassiness: number; // 0 (solid) to 1 (fully transparent/glassy)
  setGlassiness: (value: number) => void;
}

const GlassEffectContext = createContext<GlassEffectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_glassiness';

export function GlassEffectProvider({ children }: { children: React.ReactNode }) {
  const [glassiness, setGlassinessState] = useState(0.7); // Default value

  // Load saved value from local storage on mount
  useEffect(() => {
    const savedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedValue) {
      setGlassinessState(parseFloat(savedValue));
    }
  }, []);

  // Update CSS variable and local storage when glassiness changes
  useEffect(() => {
    document.documentElement.style.setProperty('--glass-intensity', glassiness.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY, glassiness.toString());
  }, [glassiness]);

  const setGlassiness = useCallback((value: number) => {
    setGlassinessState(value);
  }, []);

  return (
    <GlassEffectContext.Provider value={{ glassiness, setGlassiness }}>
      {children}
    </GlassEffectContext.Provider>
  );
}

export const useGlassEffect = () => {
  const context = useContext(GlassEffectContext);
  if (context === undefined) {
    throw new Error('useGlassEffect must be used within a GlassEffectProvider');
  }
  return context;
};