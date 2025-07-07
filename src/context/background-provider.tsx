"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { getRandomBackground } from '@/lib/backgrounds';

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

const LOCAL_STORAGE_BG_KEY = 'app_background_url';
const LOCAL_STORAGE_BG_TYPE_KEY = 'app_background_type';
const LOCAL_STORAGE_BG_MIRRORED_KEY = 'app_background_mirrored';

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
  const { supabase, session, loading: authLoading } = useSupabase();
  const [background, setBackgroundState] = useState<BackgroundState>(initialBackground); // Use the prop for initial state
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to load background settings
  useEffect(() => {
    if (authLoading) return;

    const loadBackground = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        // 1. Try to fetch from Supabase
        const { data: supabasePrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('background_url, is_video_background, is_mirrored_background')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching background preferences from Supabase:", fetchError);
          toast.error("Failed to load background preferences.");
        }

        if (supabasePrefs && supabasePrefs.background_url) {
          setBackgroundState({
            url: supabasePrefs.background_url,
            isVideo: supabasePrefs.is_video_background ?? false,
            isMirrored: supabasePrefs.is_mirrored_background ?? false,
          });
        } else {
          // 2. If no Supabase data, check local storage for migration
          const savedUrl = localStorage.getItem(LOCAL_STORAGE_BG_KEY);
          const savedType = localStorage.getItem(LOCAL_STORAGE_BG_TYPE_KEY);
          const savedMirrored = localStorage.getItem(LOCAL_STORAGE_BG_MIRRORED_KEY);

          if (savedUrl) {
            const isVideo = savedType === 'video';
            const isMirrored = savedMirrored === 'true';
            
            // Migrate to Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({
                user_id: session.user.id,
                background_url: savedUrl,
                is_video_background: isVideo,
                is_mirrored_background: isMirrored,
              }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error migrating local background to Supabase:", insertError);
              toast.error("Error migrating local background settings.");
            } else {
              setBackgroundState({ url: savedUrl, isVideo, isMirrored });
              localStorage.removeItem(LOCAL_STORAGE_BG_KEY);
              localStorage.removeItem(LOCAL_STORAGE_BG_TYPE_KEY);
              localStorage.removeItem(LOCAL_STORAGE_BG_MIRRORED_KEY);
            }
          } else {
            // 3. If neither, use the initialBackground from props and insert into Supabase
            const { error: insertError } = await supabase
              .from('user_preferences')
              .upsert({
                user_id: session.user.id,
                background_url: initialBackground.url, // Use initialBackground here
                is_video_background: initialBackground.isVideo, // Use initialBackground here
                is_mirrored_background: initialBackground.isMirrored, // Use initialBackground here
              }, { onConflict: 'user_id' });

            if (insertError) {
              console.error("Error inserting default background into Supabase:", insertError);
            } else {
              setBackgroundState(initialBackground); // Set state to initialBackground
            }
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        // Always use the random initial background for guests and don't load from local storage.
        setBackgroundState(initialBackground);
        // Clear any previously saved background to ensure a random one on next visit.
        localStorage.removeItem(LOCAL_STORAGE_BG_KEY);
        localStorage.removeItem(LOCAL_STORAGE_BG_TYPE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_BG_MIRRORED_KEY);
      }
      setLoading(false);
    };

    loadBackground();
  }, [session, supabase, authLoading, initialBackground]); // Add initialBackground to dependencies

  // Callback to change the background and save the choice
  const setBackground = useCallback(async (url: string, isVideo: boolean = false, isMirrored: boolean = false) => {
    setBackgroundState({ url, isVideo, isMirrored });

    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          background_url: url,
          is_video_background: isVideo,
          is_mirrored_background: isMirrored,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("Error updating background in Supabase:", error);
        toast.error("Failed to save background preference.");
      } else {
        // toast.success("Background saved to your account!"); // Removed for cleaner logs
      }
    } else if (!loading) { // Only save to local storage if not logged in and initial load is complete
      localStorage.setItem(LOCAL_STORAGE_BG_KEY, url);
      localStorage.setItem(LOCAL_STORAGE_BG_TYPE_KEY, isVideo ? 'video' : 'image');
      localStorage.setItem(LOCAL_STORAGE_BG_MIRRORED_KEY, String(isMirrored));
      // toast.success("Background saved locally!"); // Removed for cleaner logs
    }
  }, [isLoggedInMode, session, supabase, loading]);

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