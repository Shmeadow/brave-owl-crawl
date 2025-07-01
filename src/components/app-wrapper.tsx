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
          // Basic validation: if x or y are extremely large/small, reset
          if (parsedPos.x < -1000 || parsedPos.y < -1000 || parsedPos.x > window.innerWidth + 1000 || parsedPos.y > window.innerHeight + 1000) {
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
      const widgetWidth = 350; // Approximate width of the widget
      const widgetHeight = 300; // Approximate height of the widget
      const margin = 20; // Margin from the right and bottom edges

      // Ensure window.innerWidth/Height are valid before calculating
      const effectiveWidth = window.innerWidth > 0 ? window.innerWidth : 1200; // Fallback
      const effectiveHeight = window.innerHeight > 0 ? window.innerHeight : 800; // Fallback

      const defaultX = effectiveWidth - widgetWidth - margin;
      const defaultY = effectiveHeight - widgetHeight - margin;
      
      console.log('Pomodoro Widget calculated initial default position:', { x: defaultX, y: defaultY });
      return { x: defaultX, y: defaultY };
    }
    // Fallback for SSR or if window is undefined
    console.log('Pomodoro Widget defaulting to {0,0} for SSR.');
    return { x: 0, y: 0 };
  });

  // Recalculate default position on window resize if user hasn't moved it
  useEffect(() => {
    const handleResize = () => {
      if (hasUserMovedRef.current) {
        // If user has already moved it, don't auto-reposition on resize
        return;
      }

      const widgetWidth = 350;
      const widgetHeight = 300;
      const margin = 20;

      const effectiveWidth = window.innerWidth > 0 ? window.innerWidth : 1200;
      const effectiveHeight = window.innerHeight > 0 ? window.innerHeight : 800;

      const defaultX = effectiveWidth - widgetWidth - margin;
      const defaultY = effectiveHeight - widgetHeight - margin;

      setPomodoroPosition({ x: defaultX, y: defaultY });
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