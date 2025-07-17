"use client";

import React from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw"; // Import as type only
import "@excalidraw/excalidraw/index.min.css"; // Import Excalidraw styles

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
}

export function DrawingBoardWidget({ isCurrentRoomWritable, isMobile }: DrawingBoardWidgetProps) {
  // ExcalidrawImperativeAPI is the correct type for the ref object.
  const excalidrawRef = React.useRef<ExcalidrawImperativeAPI>(null);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 relative">
        <Excalidraw
          ref={excalidrawRef as React.Ref<ExcalidrawImperativeAPI>} // Type assertion to satisfy TS2322
          theme="dark" // Use dark theme to match app
          viewModeEnabled={!isCurrentRoomWritable} // Disable editing if not writable
          zenModeEnabled={false}
          gridModeEnabled={true}
          // You can add initialData prop here if you want to load a saved drawing
          // initialData={{ elements: [], appState: {}, files: {} }}
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