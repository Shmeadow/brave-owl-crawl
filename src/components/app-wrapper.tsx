"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";

const LOCAL_STORAGE_POMODORO_POS_KEY = 'pomodoro_widget_position';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const hasUserMovedRef = useRef(false); // New ref to track if the user has manually moved the widget

  const [pomodoroPosition, setPomodoroPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPos = localStorage.getItem(LOCAL_STORAGE_POMODORO_POS_KEY);
      if (savedPos) {
        try {
          const parsedPos = JSON.parse(savedPos);
          // Basic validation: if right or bottom are extremely large/small, reset
          if (parsedPos.right < -1000 || parsedPos.bottom < -1000 || parsedPos.right > window.innerWidth + 1000 || parsedPos.bottom > window.innerHeight + 1000) {
            console.warn("Saved pomodoro position out of bounds, resetting.");
            localStorage.removeItem(LOCAL_STORAGE_POMODORO_POS_KEY); // Clear invalid saved position
            hasUserMovedRef.current = false; // Reset user moved flag
          } else {
            hasUserMovedRef.current = true;
            console.log('Pomodoro Widget loaded saved position:', parsedPos);
            return parsedPos;
          }
        } catch (e) {
          console.error("Failed to parse saved pomodoro state, resetting:", e);
          localStorage.removeItem(LOCAL_STORAGE_POMODORO_POS_KEY); // Clear corrupted saved position
          hasUserMovedRef.current = false;
        }
      }

      // Calculate default position if no saved position or parsing failed/invalid
      const margin = 20; // Margin from the right and bottom edges
      
      const defaultRight = margin;
      const defaultBottom = margin;
      
      console.log('Pomodoro Widget calculated initial default position:', { right: defaultRight, bottom: defaultBottom });
      return { right: defaultRight, bottom: defaultBottom };
    }
    // Fallback for SSR or if window is undefined
    console.log('Pomodoro Widget defaulting to {0,0} for SSR.');
    return { right: 0, bottom: 0 };
  });

  // Recalculate default position on window resize if user hasn't moved it
  useEffect(() => {
    const handleResize = () => {
      if (hasUserMovedRef.current) {
        // If user has already moved it, don't auto-reposition on resize
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
      // Dragging right (positive delta.x) means 'right' CSS property should decrease
      // Dragging down (positive delta.y) means 'bottom' CSS property should decrease
      const newRight = prevPosition.right - delta.x;
      const newBottom = prevPosition.bottom - delta.y;
      const newPos = { right: newRight, bottom: newBottom };
      localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(newPos));
      hasUserMovedRef.current = true; // Mark as moved by user
      return newPos;
    });
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
      <Toaster />
    </SessionContextProvider>
  );
}