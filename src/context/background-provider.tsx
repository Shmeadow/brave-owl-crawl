"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { getRandomBackground } from '@/lib/backgrounds';
import { usePersistentData } from '@/hooks/use-persistent-data'; // Import the new hook

interface BackgroundState {
  url: string;
  isVideo: boolean;
  isMirrored: boolean;
}

interface BackgroundContextType {
  background: BackgroundState;
  setBackground: (url: string, isVideo?: boolean, isMirrored?: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

interface DbUserPreference {
  user_id: string;
  background_url: string;
  is_video_background: boolean;
  is_mirrored_background: boolean;
}

const LOCAL_STORAGE_BG_KEY = 'app_background_url'; // This will be the key for the combined object
const SUPABASE_TABLE_NAME = 'user_preferences';

// This component will manage rendering the background video or image
function BackgroundManager({ url, isVideo, isMirrored }: { url: string; isVideo: boolean; isMirrored: boolean }) {
  const [isImageVisible, setIsImageVisible] = useState(!isVideo);
  const [isVideoVisible, setIsVideoVisible] = useState(isVideo);

  useEffect(() => {
    setIsImageVisible(!isVideo);
    setIsVideoVisible(isVideo);
  }, [url, isVideo]);

  return (
    <div
      id="background-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -100,
        transition: 'filter 0.3s ease-in-out',
        filter: 'blur(var(--background-blur-px, 0px))',
      }}
    >
      <div
        id="background-image"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isImageVisible ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
        }}
      />
      <video
        id="background-video"
        src={url}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isVideoVisible ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
        }}
        autoPlay
        muted
        loop
        playsInline
        key={url}
      />
    </div>
  );
}

export function BackgroundProvider({ children, initialBackground }: { children: React.ReactNode; initialBackground: BackgroundState }) {
  const {
    data: background,
    loading,
    isLoggedInMode,
    setData: setBackgroundState,
    fetchData,
  } = usePersistentData<BackgroundState, DbUserPreference>({
    localStorageKey: LOCAL_STORAGE_BG_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: initialBackground,
    selectQuery: 'background_url, is_video_background, is_mirrored_background',
    transformFromDb: (dbData: DbUserPreference) => ({
      url: dbData.background_url || initialBackground.url,
      isVideo: dbData.is_video_background ?? initialBackground.isVideo,
      isMirrored: dbData.is_mirrored_background ?? initialBackground.isMirrored,
    }),
    transformToDb: (appData: BackgroundState, userId: string) => ({
      user_id: userId,
      background_url: appData.url,
      is_video_background: appData.isVideo,
      is_mirrored_background: appData.isMirrored,
    }),
    onConflictColumn: 'user_id',
    isSingleton: true,
    debounceDelay: 500,
  });

  const setBackground = useCallback((url: string, isVideo: boolean = false, isMirrored: boolean = false) => {
    setBackgroundState({ url, isVideo, isMirrored });
  }, [setBackgroundState]);

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      <BackgroundManager url={background.url} isVideo={background.isVideo} isMirrored={background.isMirrored} />
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