"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronLeft } from 'lucide-react';

interface MinimizedPlayerControlsProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  playerIsReady: boolean;
  currentIsPlaying: boolean;
  togglePlayPause: () => void;
  currentVolume: number;
  currentIsMuted: boolean;
  toggleMute: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setDisplayMode: (mode: 'normal' | 'maximized' | 'minimized') => void;
}

export function MinimizedPlayerControls({
  playerType,
  playerIsReady,
  currentIsPlaying,
  togglePlayPause,
  currentVolume,
  currentIsMuted,
  toggleMute,
  handleVolumeChange,
  setDisplayMode,
}: MinimizedPlayerControlsProps) {

  const isVolumeControlDisabled = !playerIsReady || playerType === 'spotify';

  return (
    <div className="flex items-center justify-between w-full h-full px-1"> {/* Added px-1 for internal padding */}
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="p-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105 h-9 w-9 flex-shrink-0"
        aria-label={currentIsPlaying ? "Pause" : "Play"}
        title={currentIsPlaying ? "Pause" : "Play"}
        disabled={!playerIsReady}
      >
        {currentIsPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      {/* Volume Control */}
      <div className="flex items-center space-x-1 flex-grow justify-center mx-2"> {/* Added mx-2 for spacing */}
        <button
          onClick={toggleMute}
          className="p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300 h-7 w-7 flex-shrink-0"
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
          className="w-16 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary flex-grow" // Increased width, added flex-grow
          disabled={isVolumeControlDisabled}
        />
      </div>

      {/* Undock Button */}
      <button
        onClick={() => setDisplayMode('normal')}
        className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 flex-shrink-0 h-9 w-9" // Increased size
        title="Expand Player"
      >
        <ChevronLeft size={20} />
      </button>
    </div>
  );
}