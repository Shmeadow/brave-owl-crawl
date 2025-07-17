"use client";

import React from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useTheme } from 'next-themes';
import "@excalidraw/excalidraw/index.css"; // Import Excalidraw styles

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
}

export function DrawingBoardWidget({ isCurrentRoomWritable, isMobile }: DrawingBoardWidgetProps) {
  const { theme } = useTheme();

  return (
    <div className="h-full w-full">
      <Excalidraw
        theme={theme === 'dark' || theme === 'cozy' ? 'dark' : 'light'}
        UIOptions={{
          canvasActions: {
            loadScene: false, // Disabling file loading for simplicity
            saveToActiveFile: false,
            saveAsImage: true,
          },
        }}
      />
    </div>
  );
}