"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/context/toast-visibility-provider'; // Use custom toast
import { getRandomBackground } from '@/lib/backgrounds';
import { useCurrentRoom } from '@/hooks/use-current-room';
import { useRooms } from '@/hooks/use-rooms';
import { useUserPreferences } from '@/hooks/use-user-preferences'; // Import the new user preferences hook

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
  const { preferences, updatePreference, loading: preferencesLoading } = useUserPreferences();
  const { currentRoomId } = useCurrentRoom();
  const { rooms, loading: roomsLoading } = useRooms();

  // Use preferences for the user's personal background
  const userBackground: BackgroundState = useMemo(() => {
    if (preferencesLoading) return initialBackground; // Use initial until preferences load
    return {
      url: preferences?.background_url || initialBackground.url,
      isVideo: preferences?.is_video_background ?? initialBackground.isVideo,
      isMirrored: preferences?.is_mirrored_background ?? initialBackground.isMirrored,
    };
  }, [preferences, preferencesLoading, initialBackground]);

  // Callback to change the user's personal background and save the choice
  const setBackground = useCallback((url: string, isVideo: boolean = false, isMirrored: boolean = false) => {
    updatePreference('background_url', url);
    updatePreference('is_video_background', isVideo);
    updatePreference('is_mirrored_background', isMirrored);
  }, [updatePreference]);

  // Determine the active background to display: room background takes precedence
  const backgroundToDisplay = useMemo(() => {
    if (roomsLoading) return userBackground; // Use user's background until rooms load
    const activeRoom = rooms.find(room => room.id === currentRoomId);
    return (activeRoom && activeRoom.background_url)
      ? { url: activeRoom.background_url, isVideo: activeRoom.is_video_background || false, isMirrored: false }
      : userBackground;
  }, [currentRoomId, rooms, roomsLoading, userBackground]);

  const value = useMemo(() => ({ background: userBackground, setBackground }), [userBackground, setBackground]);

  return (
    <BackgroundContext.Provider value={value}>
      <BackgroundManager url={backgroundToDisplay.url} isVideo={backgroundToDisplay.isVideo} isMirrored={backgroundToDisplay.isMirrored} />
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