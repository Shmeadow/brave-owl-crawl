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

  const widgetWidth = 224;

  return (
    <Card
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-[1001]",
        "bg-card backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
        "flex transition-all duration-300 ease-in-out",
        `w-[${widgetWidth}px]`,
        isMinimized
          ? "flex-col items-center px-2 py-1 h-auto cursor-pointer"
          : "flex-col items-center p-3 gap-3 h-auto"
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between w-full",
        isMinimized ? "hidden" : "pb-2"
      )}>
        <CardTitle className="text-xl font-bold flex-1 text-left">
          Pomodoro Timer
        </CardTitle>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Pomodoro Settings" disabled={!isCurrentRoomWritable}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Pomodoro Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] z-[1001]">
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
        </div>
      </CardHeader>

      <CardContent className={cn("flex flex-col items-center gap-4 w-full", isMinimized ? "hidden" : "flex")}>
        <div className="flex gap-2 justify-center w-full">
          <Button
            variant={mode === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('focus')}
            className={cn(mode === 'focus' && "bg-primary text-primary-foreground")}
            disabled={!isCurrentRoomWritable}
          >
            <Brain className="h-4 w-4 mr-1" /> Focus
          </Button>
          <Button
            variant={mode === 'short-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('short-break')}
            className={cn(mode === 'short-break' && "bg-secondary text-secondary-foreground")}
            disabled={!isCurrentRoomWritable}
          >
            <Coffee className="h-4 w-4 mr-1" /> Short Break
          </Button>
          <Button
            variant={mode === 'long-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('long-break')}
            className={cn(mode === 'long-break' && "bg-accent text-accent-foreground")}
            disabled={!isCurrentRoomWritable}
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
            disabled={!isCurrentRoomWritable}
          />
        ) : (
          <div
            className={cn(
              "text-4xl font-bold font-mono transition-colors",
              isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
            )}
            onClick={isCurrentRoomWritable ? handleTimeDisplayClick : undefined}
          >
            {formatTime(timeLeft)}
          </div>
        )}
        <div className="flex gap-4">
          <Button onClick={handleStartPause} size="default" disabled={!isCurrentRoomWritable}>
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
          <Button onClick={handleReset} size="default" variant="secondary" disabled={!isCurrentRoomWritable}>
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
      </CardContent>

      {isMinimized && (
        <div className="flex flex-col items-center justify-center w-full h-full py-2">
          <span className="text-sm font-semibold capitalize">{mode.replace('-', ' ')}</span>
          <div
            className={cn(
              "text-4xl font-bold font-mono my-1",
              isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
            )}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2">
            <Button onClick={(e) => { e.stopPropagation(); handleStartPause(); }} size="icon" disabled={!isCurrentRoomWritable}>
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); handleReset(); }} size="icon" variant="secondary" disabled={!isCurrentRoomWritable}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}