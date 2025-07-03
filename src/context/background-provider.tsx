"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BackgroundContextType {
  setBackground: (url: string, isVideo?: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const LOCAL_STORAGE_BG_KEY = 'app_background_url';
const LOCAL_STORAGE_BG_TYPE_KEY = 'app_background_type';

// This component will manage rendering the background video or image
function BackgroundManager({ url, isVideo }: { url: string; isVideo: boolean }) {
  useEffect(() => {
    const videoElement = document.getElementById('background-video') as HTMLVideoElement;
    if (isVideo) {
      // If it's a video, hide the body's background image and show the video element
      document.body.style.backgroundImage = '';
      if (videoElement) {
        // Check if the source needs updating to avoid reloading the same video
        if (videoElement.src !== window.location.origin + url) {
          videoElement.src = url;
          videoElement.load();
          videoElement.play().catch(e => console.error("Autoplay failed", e));
        }
        videoElement.style.display = 'block';
      }
    } else {
      // If it's an image, hide the video element and set the body's background
      if (videoElement) {
        videoElement.style.display = 'none';
        videoElement.pause();
        videoElement.src = '';
      }
      document.body.style.backgroundImage = `url(${url})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [url, isVideo]);

  return (
    <video
      id="background-video"
      style={{
        position: 'fixed',
        right: '0px',
        bottom: '0px',
        minWidth: '100%',
        minHeight: '100%',
        width: 'auto',
        height: 'auto',
        zIndex: -100,
        objectFit: 'cover',
        transition: 'opacity 1s ease-in-out',
        display: 'none',
      }}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBackgroundState] = useState({ url: '/bgimage2.jpg', isVideo: false });

  // On initial load, check local storage for a saved background
  useEffect(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_BG_KEY);
    const savedType = localStorage.getItem(LOCAL_STORAGE_BG_TYPE_KEY);
    if (savedUrl) {
      setBackgroundState({ url: savedUrl, isVideo: savedType === 'video' });
    }
  }, []);

  // Callback to change the background and save the choice to local storage
  const setBackground = useCallback((url: string, isVideo: boolean = false) => {
    setBackgroundState({ url, isVideo });
    localStorage.setItem(LOCAL_STORAGE_BG_KEY, url);
    localStorage.setItem(LOCAL_STORAGE_BG_TYPE_KEY, isVideo ? 'video' : 'image');
  }, []);

  return (
    <BackgroundContext.Provider value={{ setBackground }}>
      <BackgroundManager url={background.url} isVideo={background.isVideo} />
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