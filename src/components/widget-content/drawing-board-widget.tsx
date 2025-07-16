"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
}

// This component uses the useEditor hook, so it must be rendered as a child of <Tldraw />.
// It's now defined outside and will be conditionally rendered.
function TldrawReadOnlyController({ isReadOnly }: { isReadOnly: boolean }) {
  const editor = useEditor();

  useEffect(() => {
    editor.updateInstanceState({ isReadonly: isReadOnly });
  }, [editor, isReadOnly]);

  return null;
}

// Dynamically import Tldraw itself to ensure it's client-side only
// The TldrawReadOnlyController is now rendered within the dynamic import's resolved component.
const DynamicTldrawWithController = dynamic(
  async () => {
    const { Tldraw } = await import('@tldraw/tldraw');
    // Return a component that renders Tldraw and its controller
    return function TldrawWrapper({ isCurrentRoomWritable }: { isCurrentRoomWritable: boolean }) {
      return (
        <Tldraw
          persistenceKey="cozyhub_drawing_board"
          forceMobile={false}
        >
          <TldrawReadOnlyController isReadOnly={!isCurrentRoomWritable} />
        </Tldraw>
      );
    };
  },
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading drawing board...</div>,
  }
);

export function DrawingBoardWidget({ isCurrentRoomWritable }: DrawingBoardWidgetProps) {
  return (
    <div className="h-full w-full">
      <DynamicTldrawWithController isCurrentRoomWritable={isCurrentRoomWritable} />
    </div>
  );
}