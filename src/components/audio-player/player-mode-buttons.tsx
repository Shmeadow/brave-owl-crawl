"use client";

import React from 'react';
import { Maximize, Minimize, PanelBottomClose, PanelBottomOpen } from 'lucide-react'; // Added missing imports

interface PlayerModeButtonsProps {
  displayMode: 'normal' | 'maximized' | 'docked';
  setDisplayMode: (mode: 'normal' | 'maximized' | 'docked') => void;
}

export function PlayerModeButtons({ displayMode, setDisplayMode }: PlayerModeButtonsProps) {
  return (
    <div className="flex justify-end mt-2 gap-1">
      {displayMode === 'normal' && (
        <>
          <button
            onClick={() => setDisplayMode('maximized')}
            className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
            title="Maximize Player"
          >
            <Maximize size={16} />
          </button>
          <button
            onClick={() => setDisplayMode('docked')}
            className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
            title="Dock Player"
          >
            <PanelBottomClose size={16} />
          </button>
        </>
      )}
      {displayMode === 'maximized' && (
        <button
          onClick={() => setDisplayMode('normal')}
          className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
          title="Restore Player"
        >
          <Minimize size={16} />
        </button>
      )}
      {/* No buttons needed for 'docked' mode here, as the main player component handles its expand button */}
    </div>
  );
}