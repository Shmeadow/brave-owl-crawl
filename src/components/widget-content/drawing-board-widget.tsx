"use client";

import React, { useRef } from 'react';
import { Excalidraw, ExcalidrawAPIRef } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css'; // Excalidraw's CSS

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
}

export function DrawingBoardWidget({ isCurrentRoomWritable, isMobile }: DrawingBoardWidgetProps) {
  const excalidrawRef = useRef<ExcalidrawAPIRef | null>(null);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 relative">
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;
          }}
          theme="dark" // Set Excalidraw theme to dark
          viewModeEnabled={!isCurrentRoomWritable} // Enable view mode if not writable
          zenModeEnabled={false} // Keep zen mode off by default
          gridModeEnabled={true} // Keep grid mode on by default
          // Excalidraw is designed to be responsive and should work well on mobile by default.
          // No specific mobile-only props are typically needed here.
        />
      </div>
      {!isCurrentRoomWritable && (
        <p className="text-sm text-muted-foreground text-center p-2 border-t border-border">
          You are in read-only mode. Log in or join a writable room to draw.
        </p>
      )}
    </div>
  );
}