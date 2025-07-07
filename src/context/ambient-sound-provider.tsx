"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface GroupSoundState {
  isPlaying: boolean;
  volume: number;
  activeSoundUrl: string;
}

interface AmbientSoundContextType {
  groupsState: Map<string, GroupSoundState>;
  togglePlay: (groupName: string, defaultSoundUrl: string) => void;
  setVolume: (groupName: string, volume: number) => void;
  setActiveSound: (groupName: string, soundUrl: string) => void;
}

const AmbientSoundContext = createContext<AmbientSoundContextType | undefined>(undefined);

export function AmbientSoundProvider({ children }: { children: React.ReactNode }) {
  const audioPlayersRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [groupsState, setGroupsState] = useState<Map<string, GroupSoundState>>(new Map());

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

  const updateGroupState = useCallback((groupName: string, newPartialState: Partial<GroupSoundState>) => {
    setGroupsState(prev => {
      const newState = new Map(prev);
      const currentState = newState.get(groupName) || { isPlaying: false, volume: 0.5, activeSoundUrl: '' };
      newState.set(groupName, { ...currentState, ...newPartialState });
      return newState;
    });
  }, []);

  const getOrCreatePlayer = useCallback((groupName: string): HTMLAudioElement => {
    let player = audioPlayersRef.current.get(groupName);
    if (!player) {
      player = new Audio();
      player.loop = true;
      audioPlayersRef.current.set(groupName, player);
    }
    return player;
  }, []);

  const togglePlay = useCallback((groupName: string, defaultSoundUrl: string) => {
    const player = getOrCreatePlayer(groupName);
    const groupState = groupsState.get(groupName) || { isPlaying: false, volume: 0.5, activeSoundUrl: defaultSoundUrl };

    if (player.src !== groupState.activeSoundUrl) {
      player.src = groupState.activeSoundUrl;
      player.load();
    }
    
    player.volume = groupState.volume;

    if (groupState.isPlaying) {
      player.pause();
      updateGroupState(groupName, { isPlaying: false });
      toast.info(`Paused ${groupName}`);
    } else {
      player.play().catch(e => {
        toast.error(`Could not play ${groupName}. Please interact with the page first.`);
        console.error("Play error:", e);
      });
      updateGroupState(groupName, { isPlaying: true });
      toast.info(`Playing ${groupName}`);
    }
  }, [groupsState, getOrCreatePlayer, updateGroupState]);

  const setVolume = useCallback((groupName: string, volume: number) => {
    const player = getOrCreatePlayer(groupName);
    player.volume = volume;
    updateGroupState(groupName, { volume });
  }, [getOrCreatePlayer, updateGroupState]);

  const setActiveSound = useCallback((groupName: string, soundUrl: string) => {
    const player = getOrCreatePlayer(groupName);
    const groupState = groupsState.get(groupName) || { isPlaying: false, volume: 0.5, activeSoundUrl: soundUrl };
    
    updateGroupState(groupName, { activeSoundUrl: soundUrl });

    if (player.src !== soundUrl) {
        player.src = soundUrl;
        player.load();
        if (groupState.isPlaying) {
            player.play().catch(e => console.error("Failed to play new sound in group", e));
        }
    }
  }, [groupsState, getOrCreatePlayer, updateGroupState]);

  const value = { groupsState, togglePlay, setVolume, setActiveSound };

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