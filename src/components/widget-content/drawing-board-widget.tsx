"use client";

import React from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function DrawingBoardWidget({ isCurrentRoomWritable }: DrawingBoardWidgetProps) {
  return (
    <div className="h-full w-full">
      <Tldraw
        persistenceKey="cozyhub_drawing_board"
        forceMobile={false}
        isReadOnly={!isCurrentRoomWritable}
      />
    </div>
  );
}