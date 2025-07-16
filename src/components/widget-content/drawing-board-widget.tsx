"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic here
import { useEditor } from '@tldraw/tldraw'; // useEditor can be imported directly

import '@tldraw/tldraw/tldraw.css';

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Dynamically import Tldraw itself to ensure it's client-side only
const DynamicTldraw = dynamic(() => import('@tldraw/tldraw').then(mod => mod.Tldraw), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading drawing board...</div>,
});

// This inner component is necessary to access the editor instance via the useEditor hook,
// as it must be a child of the <Tldraw /> component.
function TldrawReadOnlyController({ isReadOnly }: { isReadOnly: boolean }) {
  const editor = useEditor();

  useEffect(() => {
    editor.updateInstanceState({ isReadonly: isReadOnly });
  }, [editor, isReadOnly]);

  return null;
}

export function DrawingBoardWidget({ isCurrentRoomWritable }: DrawingBoardWidgetProps) {
  return (
    <div className="h-full w-full">
      <DynamicTldraw
        persistenceKey="cozyhub_drawing_board"
        forceMobile={false}
      >
        <TldrawReadOnlyController isReadOnly={!isCurrentRoomWritable} />
      </DynamicTldraw>
    </div>
  );
}