"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown, Settings, ChevronUp } from "lucide-react";
import { usePomodoroState, formatTime, parseTimeToSeconds, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PomodoroSettingsModal } from "@/components/pomodoro-settings-modal";
import { useCurrentRoom } from "@/hooks/use-current-room";

interface PomodoroWidgetProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  chatPanelWidth: number;
  isMobile: boolean;
}

export function PomodoroWidget({ isMinimized, setIsMinimized, chatPanelWidth, isMobile }: PomodoroWidgetProps) {
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

  // Mobile specific state for expanded/collapsed
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const toggleMobileExpand = () => {
    setIsMobileExpanded(prev => !prev);
  };

  if (isMobile) {
    return (
      <Card
        className={cn(
          "fixed bottom-4 left-4 right-4 z-[1001]",
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
          "flex flex-col transition-all duration-300 ease-in-out",
          isMobileExpanded ? "h-auto p-2" : "h-16 p-2 items-center justify-between flex-row"
        )}
      >
        {isMobileExpanded ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between w-full p-1 pb-2">
              <CardTitle className="text-lg font-bold flex-1 text-left">
                Pomodoro
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleMobileExpand}
                title="Collapse Pomodoro Timer"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Collapse Pomodoro</span>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 w-full p-2">
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
        ) : (
          // Minimized mobile view
          <>
            <span className="text-sm font-semibold capitalize">{mode.replace('-', ' ')}</span>
            <div
              className={cn(
                "text-xl font-bold font-mono",
                isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
              )}
              onClick={toggleMobileExpand}
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
        )}
      </Card>
    );
  }

  // Desktop rendering (original logic)
  return (
    <Card
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-[1001]",
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
        "flex transition-all duration-300 ease-in-out",
        `w-[200px]`, // Fixed width for desktop
        isMinimized
          ? "flex-col items-center px-2 py-1 h-auto cursor-pointer"
          : "flex-col items-center p-2 gap-2 h-auto"
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between w-full p-1",
        isMinimized ? "hidden" : "pb-2"
      )}>
        <CardTitle className="text-lg font-bold flex-1 text-left">
          Pomodoro
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            title="Minimize Pomodoro Timer"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">Minimize Pomodoro</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn("flex flex-col items-center gap-3 w-full p-1", isMinimized ? "hidden" : "flex")}>
        <div className="flex gap-1 justify-center w-full">
          <Button
            variant={mode === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('focus')}
            className={cn("text-xs px-2 h-7", mode === 'focus' && "bg-primary text-primary-foreground")}
            disabled={!isCurrentRoomWritable}
          >
            <Brain className="h-3 w-3 mr-1" /> Focus
          </Button>
          <Button
            variant={mode === 'short-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('short-break')}
            className={cn("text-xs px-2 h-7", mode === 'short-break' && "bg-secondary text-secondary-foreground")}
            disabled={!isCurrentRoomWritable}
          >
            <Coffee className="h-3 w-3 mr-1" /> Short
          </Button>
          <Button
            variant={mode === 'long-break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('long-break')}
            className={cn("text-xs px-2 h-7", mode === 'long-break' && "bg-accent text-accent-foreground")}
            disabled={!isCurrentRoomWritable}
          >
            <Home className="h-3 w-3 mr-1" /> Long
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
            className="text-3xl font-bold font-mono text-center w-full max-w-[180px] h-10"
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

      {isMinimized && (
        <div className="flex flex-col items-center justify-center w-full h-full py-2">
          <span className="text-xs font-semibold capitalize">{mode.replace('-', ' ')}</span>
          <div
            className={cn(
              "text-3xl font-bold font-mono my-1",
              isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
            )}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
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
        </div>
      )}
    </Card>
  );
}