"use client";

import React from 'react';
import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
}

// This inner component is necessary to access the editor instance via the useEditor hook,
// as it must be a child of the <Tldraw /> component.
function TldrawReadOnlyController({ isReadOnly }: { isReadOnly: boolean }) {
  const editor = useEditor();

  React.useEffect(() => {
    // We use an effect to update the editor's read-only state whenever the prop changes.
    // The correct property on the instance state is `isReadonly` (lowercase 'o').
    editor.updateInstanceState({ isReadonly: isReadOnly });
  }, [editor, isReadOnly]);

  return null; // This component does not render anything itself.
}

export function DrawingBoardWidget({ isCurrentRoomWritable }: DrawingBoardWidgetProps) {
  return (
    <div className="h-full w-full">
      <Tldraw
        persistenceKey="cozyhub_drawing_board"
        forceMobile={false}
      >
        <TldrawReadOnlyController isReadOnly={!isCurrentRoomWritable} />
      </Tldraw>
    </div>
  );
}