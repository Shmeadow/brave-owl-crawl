"use client";

import React from 'react';

interface ProgressBarProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  playerIsReady: boolean;
  currentPlaybackTime: number;
  totalDuration: number;
  handleProgressBarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (time: number) => string;
}

export function ProgressBar({
  playerType,
  playerIsReady,
  currentPlaybackTime,
  totalDuration,
  handleProgressBarChange,
  formatTime,
}: ProgressBarProps) {
  return (
    <div className="flex items-center space-x-1 mb-1">
      <span className="text-xs text-muted-foreground w-8 text-right">{formatTime(currentPlaybackTime)}</span>
      <input
        type="range"
        min="0"
        max={totalDuration || 0}
        value={currentPlaybackTime}
        onChange={handleProgressBarChange}
        className="w-full h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
        disabled={!playerIsReady || totalDuration === 0 || playerType === 'spotify'}
      />
      <span className="text-xs text-muted-foreground w-8 text-left">{formatTime(totalDuration)}</span>
    </div>
  );
}