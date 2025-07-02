"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind } from 'lucide-react'; // Added missing imports

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
}: PlayerControlsProps) {
  return (
    <div className="flex items-center space-x-0.5 flex-shrink-0">
      {playerType !== 'spotify' && (
        <>
          <button
            onClick={skipBackward}
            className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
            aria-label="Skip backward 10 seconds"
            title="Skip Backward"
            disabled={!playerIsReady}
          >
            <Rewind size={12} />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105"
            aria-label={currentIsPlaying ? "Pause" : "Play"}
            title={currentIsPlaying ? "Pause" : "Play"}
            disabled={!playerIsReady}
          >
            {currentIsPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={skipForward}
            className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
            aria-label="Skip forward 10 seconds"
            title="Skip Forward"
            disabled={!playerIsReady}
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
          disabled={!playerIsReady || playerType === 'spotify'}
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
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${currentVolume * 100}%, hsl(var(--muted)) ${currentVolume * 100}%, hsl(var(--muted)) 100%)`
          }}
          disabled={!playerIsReady || playerType === 'spotify'}
        />
      </div>
    </div>
  );
}