"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown, Settings, ChevronUp } from "lucide-react";
import { usePomodoroState, formatTime } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PomodoroSettingsModal } from "@/components/pomodoro-settings-modal";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useFocusSession } from "@/context/focus-session-provider";

interface PomodoroWidgetProps {
  chatPanelWidth: number;
  isMobile: boolean;
}

export function PomodoroWidget({ chatPanelWidth, isMobile }: PomodoroWidgetProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    customTimes,
    isEditingTime,
    editableTimeString,
    setEditableTimeString,
    handleStartPause: baseHandleStartPause,
    handleReset: baseHandleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime,
  } = usePomodoroState();

  const { isCurrentRoomWritable } = useCurrentRoom();
  const { activeGoalTitle, isFocusSessionActive, endFocusSession } = useFocusSession();
  const [isMinimized, setIsMinimized] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartPause = () => {
    if (isRunning) {
      endFocusSession();
    }
    baseHandleStartPause();
  };

  const handleReset = () => {
    baseHandleReset();
    endFocusSession();
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

  if (isMobile) {
    return (
      <Card
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
          "flex flex-col transition-all duration-300 ease-in-out w-full",
          isMinimized ? "h-16 p-2 items-center justify-between flex-row" : "h-auto p-2"
        )}
      >
        {isMinimized ? (
          <>
            <span className="text-sm font-semibold capitalize">{mode.replace('-', ' ')}</span>
            <div
              className="text-xl font-bold font-mono cursor-pointer hover:text-primary"
              onClick={() => setIsMinimized(false)}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="flex gap-2">
              <Button onClick={(e) => { e.stopPropagation(); handleStartPause(); }} size="icon" className="h-7 w-7" disabled={!isCurrentRoomWritable}>
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); handleReset(); }} size="icon" variant="secondary" className="h-7 w-7" disabled={!isCurrentRoomWritable}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <CardHeader className="flex flex-row items-center justify-between w-full p-1 pb-2">
              <CardTitle className="text-lg font-bold flex-1 text-left">
                Pomodoro
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(true)}
                title="Collapse Pomodoro Timer"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 w-full p-2">
              {isFocusSessionActive && activeGoalTitle && mode === 'focus' && (
                <div className="text-center mb-1">
                  <p className="text-xs text-muted-foreground">Focusing on:</p>
                  <p className="text-sm font-semibold text-primary truncate max-w-[200px]">{activeGoalTitle}</p>
                </div>
              )}
              <div className="flex gap-0.5 justify-center w-full">
                <Button
                  variant={mode === 'focus' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchMode('focus')}
                  className={cn("text-xs px-1 h-7", mode === 'focus' ? "bg-primary text-primary-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Brain className="h-3 w-3" /> Focus
                </Button>
                <Button
                  variant={mode === 'short-break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchMode('short-break')}
                  className={cn("text-xs px-1 h-7", mode === 'short-break' ? "bg-secondary text-secondary-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Coffee className="h-3 w-3" /> Short
                </Button>
                <Button
                  variant={mode === 'long-break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchMode('long-break')}
                  className={cn("text-xs px-1 h-7", mode === 'long-break' ? "bg-accent text-accent-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Home className="h-3 w-3" /> Long
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
                  className="text-3xl font-bold font-mono text-center w-full h-10"
                  disabled={!isCurrentRoomWritable}
                />
              ) : (
                <div
                  className={cn(
                    "text-3xl font-bold font-mono transition-colors",
                    isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
                  )}
                  onClick={isCurrentRoomWritable ? handleTimeDisplayClick : undefined}
                >
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleStartPause} size="sm" disabled={!isCurrentRoomWritable}>
                  {isRunning ? (
                    <>
                      <Pause className="mr-1 h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-4 w-4" /> Start
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} size="sm" variant="secondary" disabled={!isCurrentRoomWritable}>
                  <RotateCcw className="mr-1 h-4 w-4" /> Reset
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2",
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
        "flex transition-all duration-300 ease-in-out z-[901]",
        isMinimized
          ? "flex-row items-center p-2 gap-3 h-14 cursor-pointer"
          : "flex-col p-4 gap-4 w-64"
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      {isMinimized ? (
        <>
          {mode === 'focus' ? <Brain className="h-5 w-5 text-primary" /> : mode === 'short-break' ? <Coffee className="h-5 w-5 text-green-500" /> : <Home className="h-5 w-5 text-blue-500" />}
          <span className="text-xl font-bold font-mono">{formatTime(timeLeft)}</span>
          <Button onClick={(e) => { e.stopPropagation(); handleStartPause(); }} size="icon" className="h-8 w-8" disabled={!isCurrentRoomWritable}>
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </>
      ) : (
        <>
          <CardHeader className="flex flex-row items-center justify-between w-full p-0">
            <CardTitle className="text-lg font-bold">Pomodoro</CardTitle>
            <div className="flex gap-1">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <PomodoroSettingsModal initialTimes={customTimes} onSave={setCustomTime} />
              </Dialog>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 w-full p-0">
            {isFocusSessionActive && activeGoalTitle && mode === 'focus' && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Focusing on:</p>
                <p className="text-sm font-semibold text-primary truncate max-w-[200px]">{activeGoalTitle}</p>
              </div>
            )}
            <div className="flex gap-2 justify-center w-full">
              <Button variant={mode === 'focus' ? 'default' : 'outline'} onClick={() => handleSwitchMode('focus')} disabled={!isCurrentRoomWritable}>Focus</Button>
              <Button variant={mode === 'short-break' ? 'default' : 'outline'} onClick={() => handleSwitchMode('short-break')} disabled={!isCurrentRoomWritable}>Short</Button>
              <Button variant={mode === 'long-break' ? 'default' : 'outline'} onClick={() => handleSwitchMode('long-break')} disabled={!isCurrentRoomWritable}>Long</Button>
            </div>
            {isEditingTime ? (
              <Input
                ref={inputRef}
                type="text"
                value={editableTimeString}
                onChange={(e) => setEditableTimeString(e.target.value)}
                onBlur={handleTimeInputBlur}
                onKeyDown={handleTimeInputKeyDown}
                className="text-5xl font-bold font-mono text-center w-full h-16 bg-transparent border-none focus-visible:ring-0"
                disabled={!isCurrentRoomWritable}
              />
            ) : (
              <div
                className={cn(
                  "text-5xl font-bold font-mono transition-colors",
                  isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
                )}
                onClick={isCurrentRoomWritable ? handleTimeDisplayClick : undefined}
              >
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={handleStartPause} size="lg" className="w-24" disabled={!isCurrentRoomWritable}>
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button onClick={handleReset} size="lg" variant="secondary" disabled={!isCurrentRoomWritable}>
                Reset
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}