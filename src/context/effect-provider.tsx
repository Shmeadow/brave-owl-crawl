"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

type EffectType = 'none' | 'rain' | 'snow' | 'raindrops'; // Removed 'plants'

interface EffectContextType {
  activeEffect: EffectType;
  setEffect: (effect: EffectType) => void;
}

const EffectContext = createContext<EffectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_active_effect';

export function EffectProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [activeEffect, setActiveEffectState] = useState<EffectType>('none');
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to load active effect
  useEffect(() => {
    if (authLoading) return;

    const loadEffect = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        // 1. Try to fetch from Supabase
        const { data: supabasePrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('active_effect')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching effect preferences from Supabase:", fetchError);
          toast.error("Failed to load effect preferences.");
        }

        if (supabasePrefs && supabasePrefs.active_effect) {
          setActiveEffectState(supabasePrefs.active_effect as EffectType);
          // console.log("Loaded active effect from Supabase."); // Removed for cleaner logs
        } else {
          // 2. If no Supabase data, check local storage for migration
          const savedEffect = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedEffect && ['none', 'rain', 'snow', 'raindrops'].includes(savedEffect)) { // Updated valid types
            // Migrate to Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, active_effect: savedEffect }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error migrating local effect to Supabase:", insertError);
              toast.error("Error migrating local effect settings.");
            } else {
              setActiveEffectState(savedEffect as EffectType);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              // toast.success("Local effect settings migrated to your account!"); // Removed for cleaner logs
            }
          } else {
            // 3. If neither, set default and insert into Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({ user_id: session.user.id, active_effect: 'none' }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error inserting default effect into Supabase:", insertError);
            } else {
              setActiveEffectState('none');
            }
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const savedEffect = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedEffect && ['none', 'rain', 'snow', 'raindrops'].includes(savedEffect)) { // Updated valid types
          setActiveEffectState(savedEffect as EffectType);
        } else {
          // Set default for guests if no local storage
          setActiveEffectState('none');
          localStorage.setItem(LOCAL_STORAGE_KEY, 'none');
        }
      }
      setLoading(false);
    };

    loadEffect();
  }, [session, supabase, authLoading]);

  const setEffect = useCallback(async (effect: EffectType) => {
    setActiveEffectState(effect);

    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: session.user.id, active_effect: effect }, { onConflict: 'user_id' });

      if (error) {
        console.error("Error updating effect in Supabase:", error);
        toast.error("Failed to save effect preference.");
      } else {
        // toast.success("Effect saved to your account!"); // Removed for cleaner logs
      }
    } else if (!loading) { // Only save to local storage if not logged in and initial load is complete
      localStorage.setItem(LOCAL_STORAGE_KEY, effect);
      // toast.success("Effect saved locally!"); // Removed for cleaner logs
    }
  }, [isLoggedInMode, session, supabase, loading]);

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