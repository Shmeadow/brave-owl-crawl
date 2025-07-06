"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { toast } from 'sonner';

interface AmbientSoundState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean;
  togglePlayPause: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>; // Expose ref for direct control if needed
}

interface AmbientSoundContextType {
  activeSounds: { [url: string]: AmbientSoundState };
  toggleSound: (url: string, name: string) => void;
  setSoundVolume: (url: string, volume: number) => void;
  toggleSoundMute: (url: string) => void;
}

const AmbientSoundContext = createContext<AmbientSoundContextType | undefined>(undefined);

export function AmbientSoundProvider({ children }: { children: React.ReactNode }) {
  // This state will hold the active instances of useHtmlAudioPlayer for each sound URL
  const [soundInstances, setSoundInstances] = useState<{ [url: string]: ReturnType<typeof useHtmlAudioPlayer> }>({});
  const [activeSoundStates, setActiveSoundStates] = useState<{ [url: string]: AmbientSoundState }>({});

  // Ref to keep track of active sound URLs to avoid re-creating hooks unnecessarily
  const activeUrlsRef = useRef<Set<string>>(new Set());

  // Effect to manage the lifecycle of useHtmlAudioPlayer instances
  useEffect(() => {
    // Cleanup function for when component unmounts or dependencies change
    return () => {
      Object.values(soundInstances).forEach(instance => {
        if (instance.audioRef.current) {
          instance.audioRef.current.pause();
          instance.audioRef.current.src = '';
          instance.audioRef.current.load();
        }
      });
    };
  }, [soundInstances]); // Re-run cleanup if soundInstances change (e.g., a sound is removed)

  const getOrCreateSoundInstance = useCallback((url: string) => {
    if (!soundInstances[url]) {
      // Dynamically create a new instance of useHtmlAudioPlayer for this URL
      const newInstance = useHtmlAudioPlayer(url);
      setSoundInstances(prev => ({ ...prev, [url]: newInstance }));
      activeUrlsRef.current.add(url);
      return newInstance;
    }
    return soundInstances[url];
  }, [soundInstances]);

  // Update activeSoundStates whenever any sound instance's internal state changes
  useEffect(() => {
    const newActiveSoundStates: { [url: string]: AmbientSoundState } = {};
    activeUrlsRef.current.forEach(url => {
      const instance = soundInstances[url];
      if (instance) {
        // Simulate isBuffering based on isPlaying and current time (simple heuristic)
        const isBuffering = instance.audioIsPlaying && instance.audioCurrentTime === 0 && instance.audioDuration > 0;
        newActiveSoundStates[url] = {
          isPlaying: instance.audioIsPlaying,
          volume: instance.audioVolume,
          isMuted: instance.audioIsMuted,
          isBuffering: isBuffering, // This is a simplified buffering state
          togglePlayPause: instance.togglePlayPause,
          setVolume: instance.setVolume,
          toggleMute: instance.toggleMute,
          audioRef: instance.audioRef,
        };
      }
    });
    setActiveSoundStates(newActiveSoundStates);
  }, [soundInstances]); // Depend on soundInstances to trigger updates

  const toggleSound = useCallback((url: string, name: string) => {
    const instance = getOrCreateSoundInstance(url);
    if (instance) {
      instance.togglePlayPause();
      // If toggling off, remove from activeUrlsRef to allow cleanup
      if (activeSoundStates[url]?.isPlaying) {
        activeUrlsRef.current.delete(url);
        setSoundInstances(prev => {
          const newState = { ...prev };
          delete newState[url]; // Remove the instance to trigger cleanup
          return newState;
        });
      } else {
        activeUrlsRef.current.add(url);
      }
    }
  }, [getOrCreateSoundInstance, activeSoundStates]);

  const setSoundVolume = useCallback((url: string, volume: number) => {
    const instance = getOrCreateSoundInstance(url);
    if (instance) {
      instance.setVolume(volume);
    }
  }, [getOrCreateSoundInstance]);

  const toggleSoundMute = useCallback((url: string) => {
    const instance = getOrCreateSoundInstance(url);
    if (instance) {
      instance.toggleMute();
    }
  }, [getOrCreateSoundInstance]);

  const contextValue = {
    activeSounds: activeSoundStates,
    toggleSound,
    setSoundVolume,
    toggleSoundMute,
  };

  return (
    <AmbientSoundContext.Provider value={contextValue}>
      {children}
    </AmbientSoundContext.Provider>
  );
}

export const useAmbientSoundContext = () => {
  const context = useContext(AmbientSoundContext);
  if (context === undefined) {
    throw new Error('useAmbientSoundContext must be used within an AmbientSoundProvider');
  }
  return context;
};