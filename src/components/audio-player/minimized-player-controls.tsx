"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn for conditional styling

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
    <div className="flex flex-col items-center justify-between w-full h-full py-1 gap-1"> {/* Changed to flex-col, added py-1, reduced gap */}
      {/* Undock Button (now at the top) */}
      <button
        onClick={() => setDisplayMode('normal')}
        className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 flex-shrink-0 h-7 w-7 flex items-center justify-center" // Smaller button
        title="Expand Player"
      >
        <ChevronLeft size={16} /> {/* Smaller icon */}
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="p-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105 h-9 w-9 flex-shrink-0 flex items-center justify-center"
        aria-label={currentIsPlaying ? "Pause" : "Play"}
        title={currentIsPlaying ? "Pause" : "Play"}
        disabled={!playerIsReady}
      >
        {currentIsPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      {/* Volume Control */}
      <div className="flex flex-col items-center gap-1 flex-grow justify-center"> {/* Changed to flex-col, reduced gap */}
        <button
          onClick={toggleMute}
          className="p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300 h-7 w-7 flex-shrink-0 flex items-center justify-center"
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
          className={cn(
            "w-16 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary",
            "transform rotate-90 origin-center", // Rotate for vertical slider
            "my-4" // Add vertical margin
          )}
          disabled={isVolumeControlDisabled}
        />
      </div>
    </div>
  );
}