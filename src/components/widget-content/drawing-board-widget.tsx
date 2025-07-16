"use client";

import React from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useTheme } from 'next-themes';

interface DrawingBoardWidgetProps {
  isCurrentRoomWritable: boolean;
}

// A custom hook to get the tldraw theme from next-themes
const useTldrawTheme = () => {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return undefined;
  }

  return theme === 'dark' || theme === 'cozy' ? 'dark' : 'light';
};

export function DrawingBoardWidget({ isCurrentRoomWritable }: DrawingBoardWidgetProps) {
  const tldrawTheme = useTldrawTheme();

  // We need to wait for the theme to be mounted to avoid hydration mismatch
  if (tldrawTheme === undefined) {
    return null;
  }

  return (
    <div className="h-full w-full">
      <Tldraw
        persistenceKey="cozyhub_drawing_board"
        forceMobile={false}
        theme={tldrawTheme}
      />
    </div>
  );
}