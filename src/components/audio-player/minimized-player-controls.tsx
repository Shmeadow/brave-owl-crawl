"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn for conditional styling

interface MinimizedPlayerControlsProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  playerIsReady: boolean;
  currentIsPlaying: boolean;
  togglePlayPause: () => void;
  currentVolume: number; // Still needed for mute logic
  currentIsMuted: boolean;
  toggleMute: () => void;
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
  setDisplayMode,
}: MinimizedPlayerControlsProps) {

  // Volume control is now only mute/unmute button
  const isVolumeControlDisabled = !playerIsReady || playerType === 'spotify';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full py-1 gap-1"> {/* Changed to flex-col, added py-1, reduced gap */}
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="p-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105 h-7 w-7 flex-shrink-0 flex items-center justify-center" // Smaller button
        aria-label={currentIsPlaying ? "Pause" : "Play"}
        title={currentIsPlaying ? "Pause" : "Play"}
        disabled={!playerIsReady}
      >
        {currentIsPlaying ? <Pause size={16} /> : <Play size={16} />} {/* Smaller icon */}
      </button>

      {/* Mute/Unmute Button (replaces slider) */}
      <button
        onClick={toggleMute}
        className="p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300 h-7 w-7 flex-shrink-0 flex items-center justify-center"
        aria-label={currentIsMuted ? "Unmute" : "Mute"}
        title={currentIsMuted ? "Unmute" : "Mute"}
        disabled={isVolumeControlDisabled}
      >
        {currentIsMuted || currentVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Undock Button (now at the bottom) */}
      <button
        onClick={() => setDisplayMode('normal')}
        className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 flex-shrink-0 h-7 w-7 flex items-center justify-center" // Smaller button
        title="Expand Player"
      >
        <ChevronUp size={16} /> {/* Changed to ChevronUp, smaller icon */}
      </button>
    </div>
  );
}