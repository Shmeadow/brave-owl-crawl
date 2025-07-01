"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home } from "lucide-react"; // Added Home for long break
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input"; // Import Input for editable time

type PomodoroMode = 'focus' | 'short-break' | 'long-break';

const DEFAULT_FOCUS_TIME_SECONDS = 30 * 60; // 30 minutes
const DEFAULT_SHORT_BREAK_TIME_SECONDS = 5 * 60; // 5 minutes
const DEFAULT_LONG_BREAK_TIME_SECONDS = 10 * 60; // 10 minutes

// Helper to convert seconds to HH:MM:SS format
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

// Helper to convert HH:MM:SS string to seconds
const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { // MM:SS format
    return parts[0] * 60 + parts[1];
  }
  return 0; // Invalid format
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [focusTime, setFocusTime] = useState(DEFAULT_FOCUS_TIME_SECONDS);
  const [shortBreakTime, setShortBreakTime] = useState(DEFAULT_SHORT_BREAK_TIME_SECONDS);
  const [longBreakTime, setLongBreakTime] = useState(DEFAULT_LONG_BREAK_TIME_SECONDS);
  const [timeLeft, setTimeLeft] = useState(focusTime); // Initialize with focusTime
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to get current time for the active mode
  const getCurrentModeTime = useCallback(() => {
    switch (mode) {
      case 'focus': return focusTime;
      case 'short-break': return shortBreakTime;
      case 'long-break': return longBreakTime;
      default: return focusTime;
    }
  }, [mode, focusTime, shortBreakTime, longBreakTime]);

  // Helper to set time for a specific mode
  const setTimeForMode = useCallback((targetMode: PomodoroMode, newTime: number) => {
    switch (targetMode) {
      case 'focus': setFocusTime(newTime); break;
      case 'short-break': setShortBreakTime(newTime); break;
      case 'long-break': setLongBreakTime(newTime); break;
    }
  }, []);

  // Initialize timeLeft when component mounts or mode changes
  useEffect(() => {
    setTimeLeft(getCurrentModeTime());
  }, [mode, getCurrentModeTime]); // Depend on mode and the getter for current mode's time

  const resetTimer = useCallback((newMode: PomodoroMode, shouldStopRunning: boolean = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (shouldStopRunning) {
      setIsRunning(false);
    }
    setMode(newMode);
    // setTimeLeft will be handled by the useEffect above
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsRunning(false);
      if (mode === 'focus') {
        toast.success("Focus session complete! Time for a break.");
        resetTimer('short-break', false);
      } else {
        toast.success("Break complete! Time to focus again.");
        resetTimer('focus', false);
      }
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode, resetTimer]);

  const handleStartPause = () => {
    if (timeLeft === 0) {
      // If timer finished, reset to current mode's *saved* time before starting
      setTimeLeft(getCurrentModeTime()); // Reset to the current mode's stored time
      setIsRunning(true);
      toast.info("Timer started!");
    } else {
      setIsRunning(!isRunning);
      toast.info(isRunning ? "Timer paused." : "Timer started!");
    }
  };

  const handleReset = () => {
    resetTimer(mode, true);
    toast.warning("Timer reset.");
  };

  const handleSwitchMode = (newMode: PomodoroMode) => {
    if (mode !== newMode) {
      // If timer is running, keep it running but switch mode and time
      // The useEffect will update timeLeft based on newMode
      setMode(newMode);
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : newMode === 'short-break' ? 'Short Break' : 'Long Break'} mode.`);
    }
  };

  const handleTimeDisplayClick = () => {
    setIsEditingTime(true);
  };

  const handleTimeInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newTime = parseTimeToSeconds(e.target.value);
    if (!isNaN(newTime) && newTime >= 0) {
      setTimeForMode(mode, newTime); // Save the new time for the current mode
      setTimeLeft(newTime); // Update the displayed time immediately
      toast.success("Timer time updated!");
    } else {
      toast.error("Invalid time format. Please use HH:MM:SS.");
    }
    setIsEditingTime(false);
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur(); // Trigger blur to save
    }
  };

  useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTime]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Pomodoro Timer</CardTitle>
        <div className="flex gap-2">
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
      <CardContent className="flex flex-col items-center gap-6">
        {isEditingTime ? (
          <Input
            ref={inputRef}
            type="text"
            defaultValue={formatTime(timeLeft)}
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