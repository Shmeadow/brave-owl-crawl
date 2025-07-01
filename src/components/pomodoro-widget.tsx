"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown, X, Settings } from "lucide-react";
import { usePomodoroState, formatTime, parseTimeToSeconds, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PomodoroSettingsModal } from "@/components/pomodoro-settings-modal"; // Import the new settings modal

interface PomodoroWidgetProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  onClose: () => void; // New prop to handle closing the bar
  chatPanelWidth: number; // New prop to get chat panel width
}

export function PomodoroWidget({ isMinimized, setIsMinimized, onClose, chatPanelWidth }: PomodoroWidgetProps) {
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
    setCustomTime, // New function from usePomodoroState
  } = usePomodoroState();

  const inputRef = useRef<HTMLInputElement>(null);

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

  const widgetWidth = 224; // Fixed width for the widget
  const rightPosition = chatPanelWidth + 16; // Chat panel width + gap

  return (
    <Card
      className={cn(
        "fixed bottom-4 z-50",
        "bg-background/50 backdrop-blur-md shadow-lg border rounded-lg",
        "flex transition-all duration-300 ease-in-out",
        `w-[${widgetWidth}px]`, // Fixed width
        isMinimized
          ? "flex-row items-center justify-between px-2 py-1 h-16 cursor-pointer" // Smaller height for minimized
          : "flex-col items-center p-3 gap-3 h-auto" // Auto height for expanded
      )}
      style={{ right: `${rightPosition}px` }} // Dynamic right position
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between w-full",
        isMinimized ? "hidden" : "pb-2"
      )}>
        <CardTitle className="text-lg font-bold flex-1 text-left">
          Pomodoro Timer
        </CardTitle>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Pomodoro Settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Pomodoro Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Pomodoro Settings</DialogTitle>
              </DialogHeader>
              <PomodoroSettingsModal
                initialTimes={customTimes}
                onSave={setCustomTime}
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            title="Minimize Pomodoro Timer"
          >
            <ChevronDown className="h-5 w-5" />
            <span className="sr-only">Minimize Pomodoro</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onClose(); // Use the new onClose prop
            }}
            title="Close Pomodoro Timer"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close Pomodoro</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn("flex flex-col items-center gap-4 w-full", isMinimized ? "hidden" : "flex")}>
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
            className="text-4xl font-bold font-mono text-center w-full max-w-[200px]"
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
          <Button onClick={handleStartPause} size="default">
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
          <Button onClick={handleReset} size="default" variant="secondary">
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
      </CardContent>

      {isMinimized && (
        <div className="flex items-center justify-between w-full h-full px-4"> {/* Added px-4 for spacing */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              title="Expand Pomodoro Timer"
            >
              <ChevronDown className="h-5 w-5 rotate-180" /> {/* Rotate icon for expand */}
              <span className="sr-only">Expand Pomodoro</span>
            </Button>
            <span className="text-lg font-bold">Pomodoro Timer</span>
          </div>
          <div
            className="text-4xl font-bold font-mono cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsMinimized(false)} // Click to expand
          >
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleStartPause} size="icon">
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button onClick={handleReset} size="icon" variant="secondary">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close Pomodoro Timer"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close Pomodoro</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}