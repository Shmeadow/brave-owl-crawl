"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface SoundState {
  isPlaying: boolean;
  volume: number;
}

interface AmbientSoundContextType {
  soundsState: Map<string, SoundState>;
  togglePlay: (url: string, name: string) => void;
  setVolume: (url: string, volume: number) => void;
}

const AmbientSoundContext = createContext<AmbientSoundContextType | undefined>(undefined);

export function AmbientSoundProvider({ children }: { children: React.ReactNode }) {
  const audioPlayersRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [soundsState, setSoundsState] = useState<Map<string, SoundState>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    const players = audioPlayersRef.current;
    return () => {
      players.forEach(player => {
        player.pause();
        player.src = '';
      });
      players.clear();
    };
  }, []);

  const updateState = useCallback((url: string, newPartialState: Partial<SoundState>) => {
    setSoundsState(prev => {
      const newState = new Map(prev);
      const currentState = newState.get(url) || { isPlaying: false, volume: 0.5 };
      newState.set(url, { ...currentState, ...newPartialState });
      return newState;
    });
  }, []);

  const togglePlay = useCallback((url: string, name: string) => {
    let player = audioPlayersRef.current.get(url);
    const currentState = soundsState.get(url) || { isPlaying: false, volume: 0.5 };

    if (!player) {
      player = new Audio(url);
      player.loop = true;
      player.volume = currentState.volume;
      audioPlayersRef.current.set(url, player);

      player.oncanplaythrough = () => {
        if (!currentState.isPlaying) { // Check if it should be playing
          player?.play().catch(e => console.error("Autoplay failed", e));
          updateState(url, { isPlaying: true });
        }
      };
      player.onerror = () => {
        toast.error(`Failed to load sound: ${name}`);
        updateState(url, { isPlaying: false });
      };
    }

    if (currentState.isPlaying) {
      player.pause();
      updateState(url, { isPlaying: false });
      toast.info(`Paused ${name}`);
    } else {
      player.play().catch(e => {
        toast.error(`Could not play ${name}. Please interact with the page first.`);
        console.error("Play error:", e);
      });
      updateState(url, { isPlaying: true });
      toast.info(`Playing ${name}`);
    }
  }, [soundsState, updateState]);

  const setVolume = useCallback((url: string, volume: number) => {
    const player = audioPlayersRef.current.get(url);
    if (player) {
      player.volume = volume;
    }
    updateState(url, { volume });
  }, [updateState]);

  const value = { soundsState, togglePlay, setVolume };

  return (
    <AmbientSoundContext.Provider value={value}>
      {children}
    </AmbientSoundContext.Provider>
  );
}

export const useAmbientSound = () => {
  const context = useContext(AmbientSoundContext);
  if (context === undefined) {
    throw new Error('useAmbientSound must be used within an AmbientSoundProvider');
  }
  return context;
};