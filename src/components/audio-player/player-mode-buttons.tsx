"use client";

import React from 'react';
import { Maximize, Minimize, ChevronRight, ChevronLeft } from 'lucide-react'; // Added missing imports

interface PlayerModeButtonsProps {
  displayMode: 'normal' | 'maximized' | 'minimized';
  setDisplayMode: (mode: 'normal' | 'maximized' | 'minimized') => void;
}

export function PlayerModeButtons({ displayMode, setDisplayMode }: PlayerModeButtonsProps) {
  return (
    <div className="flex justify-end gap-0.5 ml-1"> {/* Adjusted gap and added ml-1 */}
      {displayMode === 'normal' && (
        <button
          onClick={() => setDisplayMode('maximized')}
          className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-6 w-6"
          title="Maximize Player"
        >
          <Maximize size={14} /> {/* Adjusted size */}
        </button>
      )}
      {displayMode === 'maximized' && (
        <button
          onClick={() => setDisplayMode('normal')}
          className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-6 w-6"
          title="Shrink Player"
        >
          <Minimize size={14} /> {/* Adjusted size */}
        </button>
      )}
      <button
        onClick={() => setDisplayMode('minimized')}
        className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-6 w-6"
        title="Minimize Player"
      >
        <ChevronRight size={14} /> {/* Adjusted size */}
      </button>
    </div>
  );
}