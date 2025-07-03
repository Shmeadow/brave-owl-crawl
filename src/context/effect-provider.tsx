"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type EffectType = 'none' | 'rain' | 'snow' | 'cosmic'; // Updated effect types

interface EffectContextType {
  activeEffect: EffectType;
  setEffect: (effect: EffectType) => void;
}

const EffectContext = createContext<EffectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_active_effect';

export function EffectProvider({ children }: { children: React.ReactNode }) {
  const [activeEffect, setActiveEffect] = useState<EffectType>('none');

  useEffect(() => {
    const savedEffect = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedEffect && ['none', 'rain', 'snow', 'cosmic'].includes(savedEffect)) { // Validate saved effect
      setActiveEffect(savedEffect as EffectType);
    }
  }, []);

  const setEffect = useCallback((effect: EffectType) => {
    setActiveEffect(effect);
    localStorage.setItem(LOCAL_STORAGE_KEY, effect);
  }, []);

  return (
    <EffectContext.Provider value={{ activeEffect, setEffect }}>
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