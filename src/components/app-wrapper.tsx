"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Dock, AlignHorizontalDistributeCenter, Minimize2 } from "lucide-react"; // Import new icon

const LOCAL_STORAGE_POMODORO_POS_KEY = 'pomodoro_widget_position';
const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';

// Define approximate dimensions for docking calculations
const POMODORO_WIDGET_WIDTH_FULL_PX = 256; // max-w-sm is 16rem = 256px
const POMODORO_WIDGET_HEIGHT_FULL_PX = 300; // Approximate full height
const POMODORO_WIDGET_HEIGHT_MINIMIZED_PX = 96; // h-24 is 6rem = 96px

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const hasUserMovedRef = useRef(false);

  const [pomodoroPosition, setPomodoroPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPos = localStorage.getItem(LOCAL_STORAGE_POMODORO_POS_KEY);
      if (savedPos) {
        try {
          const parsedPos = JSON.parse(savedPos);
          // Basic validation for saved position (using top/left now)
          if (parsedPos.left < -1000 || parsedPos.top < -1000 || parsedPos.left > window.innerWidth + 1000 || parsedPos.top > window.innerHeight + 1000) {
            console.warn("Saved pomodoro position out of bounds, resetting.");
            localStorage.removeItem(LOCAL_STORAGE_POMODORO_POS_KEY);
            hasUserMovedRef.current = false;
          } else {
            hasUserMovedRef.current = true;
            return parsedPos;
          }
        } catch (e) {
          console.error("Failed to parse saved pomodoro state, resetting:", e);
          localStorage.removeItem(LOCAL_STORAGE_POMODORO_POS_KEY);
          hasUserMovedRef.current = false;
        }
      }

      // Default position: bottom-right
      const margin = 20;
      const defaultLeft = window.innerWidth - POMODORO_WIDGET_WIDTH_FULL_PX - margin;
      const defaultTop = window.innerHeight - POMODORO_WIDGET_HEIGHT_FULL_PX - margin;
      return { top: defaultTop, left: defaultLeft };
    }
    return { top: 0, left: 0 };
  });

  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      return savedMinimized === 'true';
    }
    return false;
  });

  // Effect to save minimized state to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY, String(isPomodoroWidgetMinimized));
    }
  }, [isPomodoroWidgetMinimized]);

  useEffect(() => {
    const handleResize = () => {
      // Only reset position if user hasn't manually moved it
      if (hasUserMovedRef.current) {
        return;
      }

      const margin = 20;
      const currentWidgetHeight = isPomodoroWidgetMinimized ? POMODORO_WIDGET_HEIGHT_MINIMIZED_PX : POMODORO_WIDGET_HEIGHT_FULL_PX;
      const defaultLeft = window.innerWidth - POMODORO_WIDGET_WIDTH_FULL_PX - margin;
      const defaultTop = window.innerHeight - currentWidgetHeight - margin;

      setPomodoroPosition({ top: defaultTop, left: defaultLeft });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize); // Corrected event listener
      }
    };
  }, [isPomodoroWidgetMinimized]); // Re-run if minimized state changes to adjust default position

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPomodoroPosition((prevPosition) => {
      const newLeft = prevPosition.left + delta.x;
      const newTop = prevPosition.top + delta.y;
      const newPos = { left: newLeft, top: newTop };
      localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(newPos));
      hasUserMovedRef.current = true;
      return newPos;
    });
  };

  const handleDockToBottomRight = () => {
    if (typeof window === 'undefined') return;
    const margin = 20;
    const currentWidgetHeight = isPomodoroWidgetMinimized ? POMODORO_WIDGET_HEIGHT_MINIMIZED_PX : POMODORO_WIDGET_HEIGHT_FULL_PX;
    const dockedPosition = {
      left: window.innerWidth - POMODORO_WIDGET_WIDTH_FULL_PX - margin,
      top: window.innerHeight - currentWidgetHeight - margin
    };
    setPomodoroPosition(dockedPosition);
    localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(dockedPosition));
    hasUserMovedRef.current = true;
  };

  const handleDockToBottomCenter = () => {
    if (typeof window === 'undefined') return;
    const margin = 20;
    const windowWidth = window.innerWidth;
    const currentWidgetHeight = isPomodoroWidgetMinimized ? POMODORO_WIDGET_HEIGHT_MINIMIZED_PX : POMODORO_WIDGET_HEIGHT_FULL_PX;
    const centeredLeft = (windowWidth / 2) - (POMODORO_WIDGET_WIDTH_FULL_PX / 2);
    const dockedPosition = { left: centeredLeft, top: window.innerHeight - currentWidgetHeight - margin };
    setPomodoroPosition(dockedPosition);
    localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(dockedPosition));
    hasUserMovedRef.current = true;
  };

  const handleCompactDock = () => {
    setIsPomodoroWidgetMinimized(true);
    handleDockToBottomRight(); // Dock to bottom right in compact mode
  };

  return (
    <SessionContextProvider>
      {children}
      <GoalReminderBar />
      <DndContext onDragEnd={handleDragEnd}>
        <PomodoroWidget
          initialPosition={pomodoroPosition}
          onPositionChange={setPomodoroPosition} // This prop is not directly used by PomodoroWidget for its own position, but kept for consistency if needed later.
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
        />
      </DndContext>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2"> {/* Container for dock buttons */}
        <Button
          variant="outline"
          size="icon"
          className="shadow-lg"
          onClick={handleDockToBottomRight}
          title="Dock Pomodoro to Bottom Right"
        >
          <Dock className="h-5 w-5" />
          <span className="sr-only">Dock Pomodoro to Bottom Right</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shadow-lg"
          onClick={handleDockToBottomCenter}
          title="Dock Pomodoro to Bottom Center"
        >
          <AlignHorizontalDistributeCenter className="h-5 w-5" />
          <span className="sr-only">Dock Pomodoro to Bottom Center</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shadow-lg"
          onClick={handleCompactDock}
          title="Compact Mode (Docked Bottom Right)"
        >
          <Minimize2 className="h-5 w-5" />
          <span className="sr-only">Compact Mode</span>
        </Button>
      </div>
      <Toaster />
    </SessionContextProvider>
  );
}