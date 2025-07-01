"use client";

import React, { useState, useEffect } from "react";
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
  const [pomodoroPosition, setPomodoroPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPos = localStorage.getItem(LOCAL_STORAGE_POMODORO_POS_KEY);
      if (savedPos) {
        try {
          return JSON.parse(savedPos);
        } catch (e) {
          console.error("Failed to parse saved pomodoro widget position:", e);
        }
      }
    }
    // Default position: bottom-right corner, offset from edges
    // These values will be relative to the viewport.
    // The useEffect below will calculate and set the initial position correctly.
    return { x: 0, y: 0 };
  });

  // Recalculate default position on window resize and initial mount
  useEffect(() => {
    const handleResize = () => {
      // Assuming widget width ~350px, height ~300px, 20px margin from edges
      const widgetWidth = 350;
      const widgetHeight = 300;
      const margin = 20;

      const defaultX = window.innerWidth - widgetWidth - margin;
      const defaultY = window.innerHeight - widgetHeight - margin;

      // Only reset if the current position is the initial default (0,0) or if it's very close to the calculated default
      // This prevents resetting user-dragged positions on resize
      const isInitialDefault = pomodoroPosition.x === 0 && pomodoroPosition.y === 0;
      const isNearCalculatedDefault = Math.abs(pomodoroPosition.x - defaultX) < 50 && Math.abs(pomodoroPosition.y - defaultY) < 50;

      if (isInitialDefault || isNearCalculatedDefault) {
         setPomodoroPosition({ x: defaultX, y: defaultY });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize(); // Set initial position on mount
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []); // Empty dependency array to run once on mount

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPomodoroPosition((prevPosition) => {
      const newX = prevPosition.x + delta.x;
      const newY = prevPosition.y + delta.y;
      const newPos = { x: newX, y: newY };
      localStorage.setItem(LOCAL_STORAGE_POMODORO_POS_KEY, JSON.stringify(newPos));
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