"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface SoundState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean; // New: Track if sound is muted
  prevVolume: number; // New: Store volume before muting
}

interface AmbientSoundContextType {
  soundsState: Map<string, SoundState>;
  togglePlay: (url: string, name: string) => void;
  setVolume: (url: string, volume: number) => void;
  toggleMute: (url: string, name: string) => void; // New: Toggle mute function
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
      const currentState = newState.get(url) || { isPlaying: false, volume: 0.5, isMuted: false, prevVolume: 0.5 };
      newState.set(url, { ...currentState, ...newPartialState });
      return newState;
    });
  }, []);

  const togglePlay = useCallback((url: string, name: string) => {
    let player = audioPlayersRef.current.get(url);
    const currentState = soundsState.get(url) || { isPlaying: false, volume: 0.5, isMuted: false, prevVolume: 0.5 };

    if (!player) {
      player = new Audio(url);
      player.loop = true;
      player.volume = currentState.volume;
      player.muted = currentState.isMuted; // Initialize muted state
      audioPlayersRef.current.set(url, player);

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
        updateState(url, { isPlaying: false }); // Revert state on error
      });
      updateState(url, { isPlaying: true });
      toast.info(`Playing ${name}`);
    }
  }, [soundsState, updateState]);

  const setVolume = useCallback((url: string, volume: number) => {
    const player = audioPlayersRef.current.get(url);
    if (player) {
      player.volume = volume;
      if (volume > 0 && player.muted) { // If volume is set above 0, unmute
        player.muted = false;
        updateState(url, { volume, isMuted: false, prevVolume: volume });
      } else if (volume === 0 && !player.muted) { // If volume is set to 0, mute
        player.muted = true;
        updateState(url, { volume, isMuted: true, prevVolume: volume });
      } else {
        updateState(url, { volume, prevVolume: volume });
      }
    } else {
      updateState(url, { volume, prevVolume: volume });
    }
  }, [updateState]);

  const toggleMute = useCallback((url: string, name: string) => {
    const player = audioPlayersRef.current.get(url);
    const currentState = soundsState.get(url) || { isPlaying: false, volume: 0.5, isMuted: false, prevVolume: 0.5 };

    if (player) {
      if (currentState.isMuted) {
        player.muted = false;
        player.volume = currentState.prevVolume > 0 ? currentState.prevVolume : 0.5; // Restore previous volume or default
        updateState(url, { isMuted: false, volume: player.volume });
        toast.info(`Unmuted ${name}`);
      } else {
        updateState(url, { isMuted: true, prevVolume: player.volume, volume: 0 }); // Store current volume, set to 0
        player.muted = true;
        toast.info(`Muted ${name}`);
      }
    }
  }, [soundsState, updateState]);

  const value = { soundsState, togglePlay, setVolume, toggleMute };

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