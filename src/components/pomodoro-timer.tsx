"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PomodoroMode = 'focus' | 'short-break';

const FOCUS_TIME_SECONDS = 25 * 60; // 25 minutes
const SHORT_BREAK_TIME_SECONDS = 5 * 60; // 5 minutes

export function PomodoroTimer() {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback((newMode: PomodoroMode) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME_SECONDS : SHORT_BREAK_TIME_SECONDS);
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
        toast.success("Focus session complete! Time for a short break.");
        resetTimer('short-break');
      } else {
        toast.success("Break complete! Time to focus again.");
        resetTimer('focus');
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

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleStartPause = () => {
    if (timeLeft === 0) {
      // If timer finished, reset before starting
      resetTimer(mode);
    }
    setIsRunning(!isRunning);
    toast.info(isRunning ? "Timer paused." : "Timer started!");
  };

  const handleReset = () => {
    resetTimer(mode);
    toast.warning("Timer reset.");
  };

  const handleSwitchMode = (newMode: PomodoroMode) => {
    if (mode !== newMode) {
      resetTimer(newMode);
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : 'Short Break'} mode.`);
    }
  };

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
            <Coffee className="h-4 w-4 mr-1" /> Break
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="text-7xl font-bold font-mono">
          {formatTime(timeLeft)}
        </div>
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