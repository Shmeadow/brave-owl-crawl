"use client";

import React from 'react';
import { Maximize, Minimize, ChevronRight, ChevronLeft } from 'lucide-react';

interface PlayerModeButtonsProps {
  displayMode: 'normal' | 'maximized' | 'minimized';
  setDisplayMode: (mode: 'normal' | 'maximized' | 'minimized') => void;
}

export function PlayerModeButtons({ displayMode, setDisplayMode }: PlayerModeButtonsProps) {
  return (
    <div className="flex justify-end mt-2 gap-1">
      {displayMode === 'normal' && (
        <button
          onClick={() => setDisplayMode('maximized')}
          className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
          title="Maximize Player"
        >
          <Maximize size={16} />
        </button>
      )}
      {displayMode === 'maximized' && (
        <button
          onClick={() => setDisplayMode('normal')}
          className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
          title="Shrink Player"
        >
          <Minimize size={16} />
        </button>
      )}
      <button
        onClick={() => setDisplayMode('minimized')}
        className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
        title="Minimize Player"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}