"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button"; // Import Button
import { Dock } from "lucide-react"; // Import Dock icon

const LOCAL_STORAGE_POMODORO_POS_KEY = 'pomodoro_widget_position';

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
        window.removeEventListener('resize', handleResize);
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

  const handleDockToBottom = () => {
    const margin = 20;
    const dockedPosition = { right: margin, bottom: margin };
    setPomodoroPosition(dockedPosition);
    localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(dockedPosition));
    hasUserMovedRef.current = true; // Mark as user-moved
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
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-50 shadow-lg"
        onClick={handleDockToBottom}
        title="Dock Pomodoro to Bottom Right"
      >
        <Dock className="h-5 w-5" />
        <span className="sr-only">Dock Pomodoro</span>
      </Button>
      <Toaster />
    </SessionContextProvider>
  );
}