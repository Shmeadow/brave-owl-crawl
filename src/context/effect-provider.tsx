"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { usePersistentData } from '@/hooks/use-persistent-data'; // Import the new hook

type EffectType = 'none' | 'rain' | 'snow' | 'raindrops';

interface EffectContextType {
  activeEffect: EffectType;
  setEffect: (effect: EffectType) => void;
}

const EffectContext = createContext<EffectContextType | undefined>(undefined);

interface DbUserPreference {
  user_id: string;
  active_effect: EffectType;
}

const LOCAL_STORAGE_KEY = 'app_active_effect';
const SUPABASE_TABLE_NAME = 'user_preferences';

export function EffectProvider({ children }: { children: React.ReactNode }) {
  const {
    data: activeEffect,
    loading,
    isLoggedInMode,
    setData: setActiveEffectState,
    fetchData,
  } = usePersistentData<EffectType, DbUserPreference>({
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: 'none',
    selectQuery: 'active_effect',
    transformFromDb: (dbData: DbUserPreference) => dbData.active_effect ?? 'none',
    transformToDb: (appData: EffectType, userId: string) => ({
      user_id: userId,
      active_effect: appData,
    }),
    onConflictColumn: 'user_id',
    isSingleton: true,
    debounceDelay: 500,
  });

  const setEffect = useCallback((effect: EffectType) => {
    setActiveEffectState(effect);
  }, [setActiveEffectState]);

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