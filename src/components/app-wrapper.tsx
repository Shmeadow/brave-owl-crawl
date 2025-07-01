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
        hasUserMovedRef.current = true; // If there's a saved position, assume user moved it
        try {
          return JSON.parse(savedPos);
        } catch (e) {
          console.error("Failed to parse saved pomodoro widget position:", e);
        }
      }
    }
    // Default initial value, will be overwritten by useEffect if not moved
    return { x: 0, y: 0 };
  });

  // Recalculate default position on window resize and initial mount
  useEffect(() => {
    const handleResize = () => {
      if (hasUserMovedRef.current) {
        // If user has already moved it, don't auto-reposition on resize
        return;
      }

      // Assuming widget width ~350px, height ~300px, 20px margin from edges
      const widgetWidth = 350;
      const widgetHeight = 300;
      const margin = 20;

      const defaultX = window.innerWidth - widgetWidth - margin;
      const defaultY = window.innerHeight - widgetHeight - margin;

      setPomodoroPosition({ x: defaultX, y: defaultY });
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
  }, []); // Empty dependency array, as it only depends on window events and ref

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPomodoroPosition((prevPosition) => {
      const newX = prevPosition.x + delta.x;
      const newY = prevPosition.y + delta.y;
      const newPos = { x: newX, y: newY };
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