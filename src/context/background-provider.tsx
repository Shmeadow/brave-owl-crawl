"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BackgroundState {
  url: string;
  isVideo: boolean;
  isMirrored: boolean; // New property
}

interface BackgroundContextType {
  background: BackgroundState;
  setBackground: (url: string, isVideo?: boolean, isMirrored?: boolean) => void; // Updated signature
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const LOCAL_STORAGE_BG_KEY = 'app_background_url';
const LOCAL_STORAGE_BG_TYPE_KEY = 'app_background_type';
const LOCAL_STORAGE_BG_MIRRORED_KEY = 'app_background_mirrored'; // New local storage key

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
          transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)', // Apply mirroring here
        }}
        autoPlay
        muted
        loop
        playsInline
        key={url} // Add key to force re-render on src change
      />
    </div>
  );
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  // Set default background to ani7.mp4 and mirrored
  const [background, setBackgroundState] = useState<BackgroundState>({ url: '/animated/ani7.mp4', isVideo: true, isMirrored: true });

  // On initial load, check local storage for a saved background
  useEffect(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_BG_KEY);
    const savedType = localStorage.getItem(LOCAL_STORAGE_BG_TYPE_KEY);
    const savedMirrored = localStorage.getItem(LOCAL_STORAGE_BG_MIRRORED_KEY);

    if (savedUrl) {
      setBackgroundState({
        url: savedUrl,
        isVideo: savedType === 'video',
        isMirrored: savedMirrored === 'true',
      });
    }
  }, []);

  // Callback to change the background and save the choice to local storage
  const setBackground = useCallback((url: string, isVideo: boolean = false, isMirrored: boolean = false) => {
    setBackgroundState({ url, isVideo, isMirrored });
    localStorage.setItem(LOCAL_STORAGE_BG_KEY, url);
    localStorage.setItem(LOCAL_STORAGE_BG_TYPE_KEY, isVideo ? 'video' : 'image');
    localStorage.setItem(LOCAL_STORAGE_BG_MIRRORED_KEY, String(isMirrored));
  }, []);

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