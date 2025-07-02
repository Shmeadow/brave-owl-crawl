"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown, Settings } from "lucide-react";
import { usePomodoroState, formatTime } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PomodoroSettingsModal } from "@/components/pomodoro-settings-modal";
import { useCurrentRoom } from "@/hooks/use-current-room";

interface PomodoroWidgetProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
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
    setCustomTime,
  } = usePomodoroState();

  const { isCurrentRoomWritable } = useCurrentRoom();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingTime]);

  if (isMinimized) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-card backdrop-blur-xl border-white/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(false)}
          className="h-12 w-12"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          {mode === 'focus' ? 'Focus Time' : mode === 'short-break' ? 'Short Break' : 'Long Break'}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl font-mono">
          {isEditingTime ? (
            <Input
              ref={inputRef}
              value={editableTimeString}
              onChange={(e) => setEditableTimeString(e.target.value)}
              onBlur={handleTimeInputBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTimeInputBlur()}
              className="text-6xl w-64 text-center"
              disabled={!isCurrentRoomWritable}
            />
          ) : (
            <button
              onClick={handleTimeDisplayClick}
              className="hover:bg-accent/50 rounded-lg px-4 py-2 transition-colors"
              disabled={!isCurrentRoomWritable}
            >
              {formatTime(timeLeft)}
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <Button
            onClick={handleStartPause}
            size="lg"
            disabled={!isCurrentRoomWritable}
          >
            {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            disabled={!isCurrentRoomWritable}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant={mode === 'focus' ? 'default' : 'outline'}
            onClick={() => handleSwitchMode('focus')}
            disabled={!isCurrentRoomWritable}
          >
            <Brain className="mr-2 h-4 w-4" />
            Focus
          </Button>
          <Button
            variant={mode === 'short-break' ? 'default' : 'outline'}
            onClick={() => handleSwitchMode('short-break')}
            disabled={!isCurrentRoomWritable}
          >
            <Coffee className="mr-2 h-4 w-4" />
            Short Break
          </Button>
          <Button
            variant={mode === 'long-break' ? 'default' : 'outline'}
            onClick={() => handleSwitchMode('long-break')}
            disabled={!isCurrentRoomWritable}
          >
            <Home className="mr-2 h-4 w-4" />
            Long Break
          </Button>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-4" disabled={!isCurrentRoomWritable}>
              <Settings className="mr-2 h-4 w-4" />
              Timer Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pomodoro Timer Settings</DialogTitle>
            </DialogHeader>
            <PomodoroSettingsModal
              initialTimes={customTimes}
              onSave={setCustomTime}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}