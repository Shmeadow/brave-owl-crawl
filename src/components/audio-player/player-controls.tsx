"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind } from 'lucide-react'; // Ensure these are imported

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
  totalDuration: number; // Add totalDuration to props
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
  totalDuration, // Destructure new prop
}: PlayerControlsProps) {

  // Determine if controls should be disabled based on player type and readiness
  const isDisabled = !playerIsReady || playerType === 'spotify' || (playerType === 'audio' && totalDuration === 0);

  return (
    <div className="flex items-center space-x-0.5 flex-shrink-0">
      {playerType !== 'spotify' && (
        <>
          <button
            onClick={skipBackward}
            className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
            aria-label="Skip backward 10 seconds"
            title="Skip Backward"
            disabled={isDisabled} // Use isDisabled
          >
            <Rewind size={12} />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105"
            aria-label={currentIsPlaying ? "Pause" : "Play"}
            title={currentIsPlaying ? "Pause" : "Play"}
            disabled={isDisabled} // Use isDisabled
          >
            {currentIsPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={skipForward}
            className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
            aria-label="Skip forward 10 seconds"
            title="Skip Forward"
            disabled={isDisabled} // Use isDisabled
          >
            <FastForward size={12} />
          </button>
        </>
      )}

      {/* Volume Control */}
      <div className="flex items-center space-x-0.5 ml-1">
        <button
          onClick={toggleMute}
          className="p-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300"
          aria-label={currentIsMuted ? "Unmute" : "Mute"}
          title={currentIsMuted ? "Unmute" : "Mute"}
          disabled={isDisabled} // Use isDisabled
        >
          {currentIsMuted || currentVolume === 0 ? <VolumeX size={10} /> : <Volume2 size={10} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={handleVolumeChange}
          className="w-8 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
          disabled={isDisabled} // Use isDisabled
        />
      </div>
    </div>
  );
}