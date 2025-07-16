"use client";

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useUserPreferences, EffectType } from '@/hooks/use-user-preferences'; // Import the new user preferences hook

interface EffectContextType {
  activeEffect: EffectType;
  setEffect: (effect: EffectType) => void;
}

const EffectContext = createContext<EffectContextType | undefined>(undefined);

export function EffectProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreference, loading } = useUserPreferences();

  const activeEffect = preferences?.active_effect ?? 'none'; // Default to 'none' if not loaded or null

  const setEffect = useCallback((effect: EffectType) => {
    updatePreference('active_effect', effect);
  }, [updatePreference]);

  const value = useMemo(() => ({ activeEffect, setEffect }), [activeEffect, setEffect]);

  return (
    <EffectContext.Provider value={value}>
      {children}
    </EffectContext.Provider>
  );
}

export const useEffects = () => {
  const context = useContext(EffectContext);
  if (context === undefined) {
    throw new Error('useEffects must be used within an EffectProvider');
  }
  return context;
};