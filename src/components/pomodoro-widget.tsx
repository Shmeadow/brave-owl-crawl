"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown } from "lucide-react";
import { usePomodoroState, formatTime, parseTimeToSeconds, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface PomodoroWidgetProps {
  isMinimized: boolean; // Controlled by parent
  setIsMinimized: (minimized: boolean) => void; // Controlled by parent
}

export function PomodoroWidget({ isMinimized, setIsMinimized }: PomodoroWidgetProps) {
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
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50", // Fixed position at bottom-center
        "bg-background/50 backdrop-blur-md shadow-lg border",
        "flex transition-all duration-300 ease-in-out",
        isMinimized
          ? "flex-row items-center justify-center p-1 w-fit h-fit cursor-pointer" // Minimized: row, tighter padding, fit content, add cursor-pointer
          : "flex-col items-center p-4 gap-4 w-full max-w-sm h-auto" // Expanded: column, original padding
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined} // Make whole card clickable to undock when minimized
    >
      {/* CardHeader - only visible when not minimized */}
      <CardHeader className={cn(
        "flex flex-row items-center justify-between w-full",
        isMinimized ? "hidden" : "pb-2" // Hide header completely when minimized
      )}>
        <CardTitle className="text-xl font-bold flex-1 text-left">
          Pomodoro Timer
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card's onClick from firing
            setIsMinimized(true); // Always minimize when this button is clicked
          }}
          title="Minimize Pomodoro Timer"
        >
          <ChevronDown className="h-5 w-5" />
          <span className="sr-only">Minimize Pomodoro</span>
        </Button>
      </CardHeader>

      {/* CardContent - visible when not minimized */}
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
            className="text-3xl font-bold font-mono text-center w-full max-w-[250px]"
          />
        ) : (
          <div
            className="text-3xl font-bold font-mono cursor-pointer hover:text-primary transition-colors"
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

      {/* Minimized content - always display time, no editing, no expand button */}
      {isMinimized && (
        <div className="flex items-center justify-center w-full h-full">
          <div
            className="text-3xl font-bold font-mono" // No cursor-pointer here, as the whole card is clickable
          >
            {formatTime(timeLeft)}
          </div>
          {/* Removed the ChevronUp button as the whole card is now the undock trigger */}
        </div>
      )}
    </Card>
  );
}