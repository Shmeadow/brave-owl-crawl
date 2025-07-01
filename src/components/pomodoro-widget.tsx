"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, GripVertical } from "lucide-react";
import { usePomodoroState, formatTime, parseTimeToSeconds, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface PomodoroWidgetProps {
  initialPosition: { x: number; y: number };
  onPositionChange: (newPosition: { x: number; y: number }) => void;
}

export function PomodoroWidget({ initialPosition, onPositionChange }: PomodoroWidgetProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    customTimes,
    isEditingTime,
    editableTimeString,
    setEditableTimeString,
    handleStartPause,
    handleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
  } = usePomodoroState();

  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'pomodoro-widget',
  });

  const style = {
    position: 'fixed',
    // Apply the initial position and the current drag delta using transform
    transform: CSS.Transform.toString({
      x: initialPosition.x + (transform ? transform.x : 0),
      y: initialPosition.y + (transform ? transform.y : 0),
      scaleX: 1,
      scaleY: 1,
    }),
    zIndex: 50,
    cursor: 'grab', // Indicate draggable
  };

  // Log the final applied style to the console
  useEffect(() => {
    console.log('PomodoroWidget rendering with style:', style);
  }, [style]);


  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTime]);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full max-w-md bg-background/50 backdrop-blur-md shadow-lg border", // Removed mx-auto
        "flex flex-col items-center p-4 gap-4"
      )}
    >
      <CardHeader className="flex flex-col items-center space-y-4 pb-2 w-full">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-xl font-bold text-center flex-1">Pomodoro Timer</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-grab"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-5 w-5" />
            <span className="sr-only">Drag Pomodoro</span>
          </Button>
        </div>
        <div className="flex gap-2 justify-center w-full">
          <Button
            variant={mode === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('focus')}
            className={cn(mode === 'focus' && "bg-primary text-primary-foreground")}
          >
            <Brain className="h-4 w-4 mr-1" /> Focus
          </Button>
          <Button
            variant={mode === 'short-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('short-break')}
            className={cn(mode === 'short-break' && "bg-secondary text-secondary-foreground")}
          >
            <Coffee className="h-4 w-4 mr-1" /> Short Break
          </Button>
          <Button
            variant={mode === 'long-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('long-break')}
            className={cn(mode === 'long-break' && "bg-accent text-accent-foreground")}
          >
            <Home className="h-4 w-4 mr-1" /> Long Break
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 w-full">
        {isEditingTime ? (
          <Input
            ref={inputRef}
            type="text"
            value={editableTimeString}
            onChange={(e) => setEditableTimeString(e.target.value)}
            onBlur={handleTimeInputBlur}
            onKeyDown={handleTimeInputKeyDown}
            className="text-7xl font-bold font-mono text-center w-full max-w-[250px]"
          />
        ) : (
          <div
            className="text-7xl font-bold font-mono cursor-pointer hover:text-primary transition-colors"
            onClick={handleTimeDisplayClick}
          >
            {formatTime(timeLeft)}
          </div>
        )}
        <div className="flex gap-4">
          <Button onClick={handleStartPause} size="lg">
            {isRunning ? (
              <>
                <Pause className="mr-2 h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> Start
              </>
            )}
          </Button>
          <Button onClick={handleReset} size="lg" variant="secondary">
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}