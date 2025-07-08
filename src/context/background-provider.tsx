"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { staticImages } from '@/lib/backgrounds';

interface BackgroundContextType {
  backgroundUrl: string;
  isVideo: boolean;
  setBackground: (url: string, isVideo: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_URL = 'app_background_url';
const LOCAL_STORAGE_KEY_IS_VIDEO = 'app_background_is_video';
const DEFAULT_BACKGROUND = staticImages[0].url;

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BACKGROUND);
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const setBackground = useCallback(async (url: string, isVideo: boolean) => {
    setBackgroundUrl(url);
    setIsVideo(isVideo);

    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: session.user.id, background_url: url, is_video_background: isVideo }, { onConflict: 'user_id' });
      if (error) {
        toast.error("Failed to save background preference.");
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_URL, url);
      localStorage.setItem(LOCAL_STORAGE_KEY_IS_VIDEO, String(isVideo));
    }
  }, [isLoggedInMode, session, supabase]);

  useEffect(() => {
    if (authLoading) return;

    const loadBackground = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('background_url, is_video_background')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching background preference:", error);
        } else if (data && data.background_url) {
          setBackgroundUrl(data.background_url);
          setIsVideo(data.is_video_background || false);
        } else {
          const localUrl = localStorage.getItem(LOCAL_STORAGE_KEY_URL);
          const localIsVideo = localStorage.getItem(LOCAL_STORAGE_KEY_IS_VIDEO) === 'true';
          if (localUrl) {
            await setBackground(localUrl, localIsVideo);
            localStorage.removeItem(LOCAL_STORAGE_KEY_URL);
            localStorage.removeItem(LOCAL_STORAGE_KEY_IS_VIDEO);
          } else {
            await setBackground(DEFAULT_BACKGROUND, false);
          }
        }
      } else {
        setIsLoggedInMode(false);
        const localUrl = localStorage.getItem(LOCAL_STORAGE_KEY_URL);
        const localIsVideo = localStorage.getItem(LOCAL_STORAGE_KEY_IS_VIDEO) === 'true';
        if (localUrl) {
          setBackgroundUrl(localUrl);
          setIsVideo(localIsVideo);
        } else {
          setBackgroundUrl(DEFAULT_BACKGROUND);
          setIsVideo(false);
        }
      }
      setLoading(false);
    };

    loadBackground();
  }, [session, supabase, authLoading, setBackground]);

  const value = { backgroundUrl, isVideo, setBackground };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};