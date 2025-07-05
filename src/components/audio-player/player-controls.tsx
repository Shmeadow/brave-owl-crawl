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
  canPlayPause: boolean; // New prop
  canSeek: boolean;      // New prop
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
  canPlayPause, // Destructure new prop
  canSeek,      // Destructure new prop
}: PlayerControlsProps) {

  // Volume control should be disabled if player is not ready or it's a Spotify embed
  const isVolumeControlDisabled = !playerIsReady || playerType === 'spotify';

  return (
    <div className="flex items-center space-x-0.5 flex-shrink-0">
      {playerType !== 'spotify' && (
        <>
          <button
            onClick={skipBackward}
            className="p-0 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-6 w-6"
            aria-label="Skip backward 10 seconds"
            title="Skip Backward"
            disabled={!canSeek} // Use canSeek
          >
            <Rewind size={14} />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105 h-8 w-8"
            aria-label={currentIsPlaying ? "Pause" : "Play"}
            title={currentIsPlaying ? "Pause" : "Play"}
            disabled={!canPlayPause} // Use canPlayPause
          >
            {currentIsPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={skipForward}
            className="p-0 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-6 w-6"
            aria-label="Skip forward 10 seconds"
            title="Skip Forward"
            disabled={!canSeek} // Use canSeek
          >
            <FastForward size={14} />
          </button>
        </>
      )}

      {/* Volume Control */}
      <div className="flex items-center space-x-0.5 ml-1">
        <button
          onClick={toggleMute}
          className="p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300 h-6 w-6"
          aria-label={currentIsMuted ? "Unmute" : "Mute"}
          title={currentIsMuted ? "Unmute" : "Mute"}
          disabled={isVolumeControlDisabled} // Use isVolumeControlDisabled
        >
          {currentIsMuted || currentVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={handleVolumeChange}
          className="w-6 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
          disabled={isVolumeControlDisabled} // Use isVolumeControlDisabled
        />
      </div>
    </div>
  );
}