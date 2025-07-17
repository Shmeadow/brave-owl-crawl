"use client";

import React from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css'; // Import tldraw styles

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
}

export function DrawingBoardWidget({ isCurrentRoomWritable, isMobile }: DrawingBoardWidgetProps) {
  return (
    <div className="h-full w-full">
      <Tldraw />
    </div>
  );
}