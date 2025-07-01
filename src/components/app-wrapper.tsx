"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Dock, AlignHorizontalDistributeCenter } from "lucide-react"; // Import new icon

const LOCAL_STORAGE_POMODORO_POS_KEY = 'pomodoro_widget_position';
const POMODORO_WIDGET_WIDTH_PX = 192; // max-w-xs is 12rem = 192px

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
          // Basic validation for saved position
          if (parsedPos.right < -1000 || parsedPos.bottom < -1000 || parsedPos.right > window.innerWidth + 1000 || parsedPos.bottom > window.innerHeight + 1000) {
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

      const margin = 20;
      const defaultRight = margin;
      const defaultBottom = margin;
      return { right: defaultRight, bottom: defaultBottom };
    }
    return { right: 0, bottom: 0 };
  });

  useEffect(() => {
    const handleResize = () => {
      if (hasUserMovedRef.current) {
        return;
      }

      const margin = 20;
      const defaultRight = margin;
      const defaultBottom = margin;

      setPomodoroPosition({ right: defaultRight, bottom: defaultBottom });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('change', handleResize); // Changed to 'change' for media queries
      }
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPomodoroPosition((prevPosition) => {
      const newRight = prevPosition.right - delta.x;
      const newBottom = prevPosition.bottom - delta.y;
      const newPos = { right: newRight, bottom: newBottom };
      localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(newPos));
      hasUserMovedRef.current = true;
      return newPos;
    });
  };

  const handleDockToBottomRight = () => {
    const margin = 20;
    const dockedPosition = { right: margin, bottom: margin };
    setPomodoroPosition(dockedPosition);
    localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(dockedPosition));
    hasUserMovedRef.current = true;
  };

  const handleDockToBottomCenter = () => {
    if (typeof window === 'undefined') return;
    const margin = 20;
    const windowWidth = window.innerWidth;
    const centeredRight = (windowWidth / 2) - (POMODORO_WIDGET_WIDTH_PX / 2);
    const dockedPosition = { right: centeredRight, bottom: margin };
    setPomodoroPosition(dockedPosition);
    localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(dockedPosition));
    hasUserMovedRef.current = true;
  };

  return (
    <SessionContextProvider>
      {children}
      <GoalReminderBar />
      <DndContext onDragEnd={handleDragEnd}>
        <PomodoroWidget
          initialPosition={pomodoroPosition}
          onPositionChange={setPomodoroPosition}
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
      </div>
      <Toaster />
    </SessionContextProvider>
  );
}