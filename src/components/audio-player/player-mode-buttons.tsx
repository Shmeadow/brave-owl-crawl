"use client";

import React from 'react';
import { Maximize, Minimize, ChevronRight, ChevronLeft } from 'lucide-react'; // Added missing imports

interface PlayerModeButtonsProps {
  displayMode: 'normal' | 'maximized' | 'minimized';
  setDisplayMode: (mode: 'normal' | 'maximized' | 'minimized') => void;
}

export function PlayerModeButtons({ displayMode, setDisplayMode }: PlayerModeButtonsProps) {
  return (
    <div className="flex justify-end gap-1 ml-2"> {/* Adjusted gap and ml */}
      {displayMode === 'normal' && (
        <button
          onClick={() => setDisplayMode('maximized')}
          className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7" // Increased size
          title="Maximize Player"
        >
          <Maximize size={16} /> {/* Increased icon size */}
        </button>
      )}
      {displayMode === 'maximized' && (
        <button
          onClick={() => setDisplayMode('normal')}
          className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7" // Increased size
          title="Shrink Player"
        >
          <Minimize size={16} /> {/* Increased icon size */}
        </button>
      )}
      <button
        onClick={() => setDisplayMode('minimized')}
        className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7" // Increased size
        title="Minimize Player"
      >
        <ChevronRight size={16} /> {/* Increased icon size */}
      </button>
    </div>
  );
}