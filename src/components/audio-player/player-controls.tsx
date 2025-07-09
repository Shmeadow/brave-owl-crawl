"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind, Maximize, Minimize, ChevronRight } from 'lucide-react';

interface PlayerControlsProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  playerIsReady: boolean;
  currentIsPlaying: boolean;
  togglePlayPause: () => void;
  skipBackward: () => void;
  skipForward: () => void;
  currentVolume: number;
  currentIsMuted: boolean;
  toggleMute: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canPlayPause: boolean;
  canSeek: boolean;
  displayMode: 'normal' | 'maximized' | 'minimized';
  setDisplayMode: (mode: 'normal' | 'maximized' | 'minimized') => void;
}

export function PlayerControls({
  playerType,
  playerIsReady,
  currentIsPlaying,
  togglePlayPause,
  skipBackward,
  skipForward,
  currentVolume,
  currentIsMuted,
  toggleMute,
  handleVolumeChange,
  canPlayPause,
  canSeek,
  displayMode,
  setDisplayMode,
}: PlayerControlsProps) {

  const isVolumeControlDisabled = !playerIsReady || playerType === 'spotify';

  return (
    <div className="flex items-center space-x-2 flex-shrink-0">
      {playerType !== 'spotify' && (
        <div className="flex items-center space-x-1">
          <button
            onClick={skipBackward}
            className="p-0 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7 flex items-center justify-center"
            aria-label="Skip backward 10 seconds"
            title="Skip Backward"
            disabled={!canSeek}
          >
            <Rewind size={16} />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105 h-9 w-9 flex items-center justify-center"
            aria-label={currentIsPlaying ? "Pause" : "Play"}
            title={currentIsPlaying ? "Pause" : "Play"}
            disabled={!canPlayPause}
          >
            {currentIsPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={skipForward}
            className="p-0 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7 flex items-center justify-center"
            aria-label="Skip forward 10 seconds"
            title="Skip Forward"
            disabled={!canSeek}
          >
            <FastForward size={16} />
          </button>
        </div>
      )}

      {/* Volume Control */}
      <div className="flex items-center space-x-1 ml-3">
        <button
          onClick={toggleMute}
          className="p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300 h-7 w-7 flex items-center justify-center"
          aria-label={currentIsMuted ? "Unmute" : "Mute"}
          title={currentIsMuted ? "Unmute" : "Mute"}
          disabled={isVolumeControlDisabled}
        >
          {currentIsMuted || currentVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={handleVolumeChange}
          className="w-16 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
          disabled={isVolumeControlDisabled}
        />
      </div>

      {/* Player Mode Buttons (now integrated) */}
      <div className="flex justify-end gap-1 ml-2">
        {displayMode === 'normal' && (
          <button
            onClick={() => setDisplayMode('maximized')}
            className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7 flex items-center justify-center"
            title="Maximize Player"
          >
            <Maximize size={16} />
          </button>
        )}
        {displayMode === 'maximized' && (
          <button
            onClick={() => setDisplayMode('normal')}
            className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7 flex items-center justify-center"
            title="Shrink Player"
          >
            <Minimize size={16} />
          </button>
        )}
        <button
          onClick={() => setDisplayMode('minimized')}
          className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7 flex items-center justify-center"
          title="Minimize Player"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}