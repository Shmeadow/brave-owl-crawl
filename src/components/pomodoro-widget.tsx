"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown, ChevronUp } from "lucide-react";
import { usePomodoroState, formatTime, parseTimeToSeconds, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface PomodoroWidgetProps {
  initialPosition: { top: number; left: number }; // Changed to top/left
  onPositionChange: (newPosition: { top: number; left: number }) => void; // Changed to top/left
  isMinimized: boolean; // Controlled by parent
  setIsMinimized: (minimized: boolean) => void; // Controlled by parent
}

export function PomodoroWidget({ initialPosition, onPositionChange, isMinimized, setIsMinimized }: PomodoroWidgetProps) {
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

  // Apply initial position and dnd-kit's transform for smooth dragging
  const style = {
    position: 'fixed' as 'fixed',
    top: `${initialPosition.top}px`, // Use top
    left: `${initialPosition.left}px`, // Use left
    zIndex: 50,
    cursor: 'grab',
    transform: CSS.Transform.toString(transform),
  };

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
        "w-full max-w-sm bg-background/50 backdrop-blur-md shadow-lg border", // Changed max-w-xs to max-w-sm
        "flex flex-col items-center p-4 gap-4 transition-all duration-300 ease-in-out",
        isMinimized ? "h-24" : "h-auto"
      )}
      {...listeners}
      {...attributes}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 w-full cursor-grab">
        <CardTitle className="text-xl font-bold flex-1 text-left">
          {isMinimized ? "Pomodoro" : "Pomodoro Timer"}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
        >
          {isMinimized ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          <span className="sr-only">{isMinimized ? "Maximize" : "Minimize"} Pomodoro</span>
        </Button>
      </CardHeader>
      <CardContent className={cn("flex flex-col items-center gap-6 w-full", isMinimized ? "hidden" : "flex")}>
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
        {isEditingTime ? (
          <Input
            ref={inputRef}
            type="text"
            value={editableTimeString}
            onChange={(e) => setEditableTimeString(e.target.value)}
            onBlur={handleTimeInputBlur}
            onKeyDown={handleTimeInputKeyDown}
            className="text-4xl font-bold font-mono text-center w-full max-w-[250px]"
          />
        ) : (
          <div
            className="text-4xl font-bold font-mono cursor-pointer hover:text-primary transition-colors"
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
      {isMinimized && (
        <CardContent className="flex items-center justify-center w-full h-full pt-0">
          <div
            className="text-3xl font-bold font-mono cursor-pointer hover:text-primary transition-colors"
            onClick={handleTimeDisplayClick}
          >
            {formatTime(timeLeft)}
          </div>
        </CardContent>
      )}
    </Card>
  );
}