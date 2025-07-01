"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PomodoroMode, formatTime, parseTimeToSeconds } from "@/hooks/use-pomodoro-state"; // Import from new hook

interface PomodoroTimerProps {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes: {
    'focus': number;
    'short-break': number;
    'long-break': number;
  };
  isEditingTime: boolean;
  editableTimeString: string;
  setEditableTimeString: (value: string) => void;
  handleStartPause: () => void;
  handleReset: () => void;
  handleSwitchMode: (newMode: PomodoroMode) => void;
  handleTimeDisplayClick: () => void;
  handleTimeInputBlur: () => void;
}

export function PomodoroTimer({
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
}: PomodoroTimerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTime]);

  return (
    <Card className="w-full max-w-md mx-auto bg-background/50 backdrop-blur-md">
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