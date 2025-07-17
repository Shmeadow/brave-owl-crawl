"use client";

import React from 'react';

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
}

export function DrawingBoardWidget({ isCurrentRoomWritable, isMobile }: DrawingBoardWidgetProps) {
  return (
    <div className="h-full w-full">
      <iframe
        src="https://sketch.io/sketchpad/"
        className="w-full h-full border-0"
        title="Sketch.io Drawing Board"
        allow="fullscreen"
      ></iframe>
    </div>
  );
}