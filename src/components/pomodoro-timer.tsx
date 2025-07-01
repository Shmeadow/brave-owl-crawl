"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PomodoroMode = 'focus' | 'short-break' | 'long-break';

const DEFAULT_TIMES = {
  'focus': 30 * 60, // 30 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 10 * 60, // 10 minutes
};

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
  const [customTimes, setCustomTimes] = useState(DEFAULT_TIMES);
  const [timeLeft, setTimeLeft] = useState(customTimes.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editableTimeString, setEditableTimeString] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentModeTime = useCallback(() => {
    return customTimes[mode];
  }, [mode, customTimes]);

  useEffect(() => {
    setTimeLeft(getCurrentModeTime());
  }, [mode, getCurrentModeTime]);

  const resetTimer = useCallback((newMode: PomodoroMode, shouldStopRunning: boolean = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (shouldStopRunning) {
      setIsRunning(false);
    }
    setMode(newMode);
    setTimeLeft(customTimes[newMode]);
  }, [customTimes]);

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
      setTimeLeft(getCurrentModeTime());
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
      setMode(newMode);
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : newMode === 'short-break' ? 'Short Break' : 'Long Break'} mode.`);
    }
  };

  const handleTimeDisplayClick = () => {
    setIsEditingTime(true);
    setEditableTimeString(formatTime(timeLeft));
  };

  const handleTimeInputBlur = () => {
    const newTime = parseTimeToSeconds(editableTimeString);
    if (!isNaN(newTime) && newTime >= 0) {
      setCustomTimes(prev => ({ ...prev, [mode]: newTime }));
      setTimeLeft(newTime);
      toast.success("Timer time updated!");
    } else {
      toast.error("Invalid time format. Please use HH:MM:SS.");
      setTimeLeft(getCurrentModeTime());
    }
    setIsEditingTime(false);
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTime]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center space-y-4 pb-2">
        <CardTitle className="text-2xl font-bold text-center">Pomodoro Timer</CardTitle>
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
      <CardContent className="flex flex-col items-center gap-6">
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