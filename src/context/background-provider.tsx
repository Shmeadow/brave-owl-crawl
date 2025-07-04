"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCurrentRoom } from '@/hooks/use-current-room'; // Import useCurrentRoom

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
      {url && !isVideo && ( // Only render image if URL exists and it's not a video
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
      )}
      {url && isVideo && ( // Only render video if URL exists and it's a video
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
      )}
    </div>
  );
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const { currentRoomBackgroundUrl, isCurrentRoomVideoBackground } = useCurrentRoom();
  const [background, setBackgroundState] = useState<BackgroundState>({
    url: currentRoomBackgroundUrl,
    isVideo: isCurrentRoomVideoBackground,
    isMirrored: false, // Default to not mirrored, can be added as a room setting later
  });

  // Update background state when currentRoomBackgroundUrl or isCurrentRoomVideoBackground changes
  useEffect(() => {
    setBackgroundState({
      url: currentRoomBackgroundUrl,
      isVideo: isCurrentRoomVideoBackground,
      isMirrored: false, // Keep default for now
    });
  }, [currentRoomBackgroundUrl, isCurrentRoomVideoBackground]);

  // Callback to change the background (for the BackgroundEffectsMenu)
  const setBackground = useCallback((url: string, isVideo: boolean = false, isMirrored: boolean = false) => {
    setBackgroundState({ url, isVideo, isMirrored });
    // Note: This local setBackground will override the room's background.
    // To make it persistent for the room, it would need to update the room's background_url in Supabase.
    // For now, this is a temporary override for the current session.
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