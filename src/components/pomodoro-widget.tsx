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
import { useFocusSession } from "@/context/focus-session-provider";

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
    handleStartPause: baseHandleStartPause,
    handleReset: baseHandleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime,
  } = usePomodoroState();

  const { isCurrentRoomWritable } = useCurrentRoom();
  const { activeGoalTitle, isFocusSessionActive, endFocusSession } = useFocusSession();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartPause = () => {
    if (isRunning) { // If it's currently running, pausing will end the session
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

  const [isMobileExpanded, setIsMobileExpanded] = useState(false); // Default to false for mobile

  const toggleMobileExpand = () => {
    setIsMobileExpanded(prev => !prev);
  };

  if (isMobile) {
    return (
      <Card
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
          "flex flex-col transition-all duration-300 ease-in-out w-full",
          isMobileExpanded ? "h-auto p-2" : "h-14 p-2 items-center justify-between flex-row"
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
            <CardContent className="flex flex-col items-center gap-2 w-full p-1">
              {isFocusSessionActive && activeGoalTitle && mode === 'focus' && (
                <div className="text-center mb-1">
                  <p className="text-xs text-muted-foreground">Focusing on:</p>
                  <p className="text-sm font-semibold text-primary truncate max-w-[200px]">{activeGoalTitle}</p>
                </div>
              )}
              <div className="flex gap-2 justify-center w-full">
                <Button
                  variant={mode === 'focus' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchMode('focus')}
                  className={cn("text-sm px-2 h-8", mode === 'focus' ? "bg-primary text-primary-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Brain className="h-3 w-3" /> Focus
                </Button>
                <Button
                  variant={mode === 'short-break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchMode('short-break')}
                  className={cn("text-sm px-2 h-8", mode === 'short-break' ? "bg-secondary text-secondary-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Coffee className="h-3 w-3" /> Short
                </Button>
                <Button
                  variant={mode === 'long-break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchMode('long-break')}
                  className={cn("text-sm px-2 h-8", mode === 'long-break' ? "bg-accent text-accent-foreground" : "")}
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
            <div className="flex gap-3">
              <Button onClick={(e) => { e.stopPropagation(); handleStartPause(); }} size="icon" className="h-9 w-9" disabled={!isCurrentRoomWritable}>
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); handleReset(); }} size="icon" variant="secondary" className="h-9 w-9" disabled={!isCurrentRoomWritable}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2",
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
        "flex transition-all duration-300 ease-in-out z-[901]",
        "w-64", // Changed from w-56 to w-64 for desktop
        isMinimized
          ? "flex-col items-center px-2 py-1 h-auto cursor-pointer"
          : "flex-col items-center p-4 gap-4 h-auto" // Changed p-3 gap-3 to p-4 gap-4
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between w-full p-0",
        isMinimized ? "hidden" : "pb-2"
      )}>
        <CardTitle className="text-lg font-bold flex-1 text-left">
          Pomodoro
        </CardTitle>
        <div className="flex gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Pomodoro Settings"
                disabled={!isCurrentRoomWritable}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Pomodoro Settings</span>
              </Button>
            </DialogTrigger>
            <PomodoroSettingsModal initialTimes={customTimes} onSave={setCustomTime} />
          </Dialog>
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

      <CardContent className={cn("flex flex-col items-center gap-4 w-full p-0", isMinimized ? "hidden" : "flex")}> {/* Changed gap-3 to gap-4 */}
        {isFocusSessionActive && activeGoalTitle && mode === 'focus' && (
          <div className="text-center mb-2">
            <p className="text-xs text-muted-foreground">Focusing on:</p>
            <p className="text-sm font-semibold text-primary truncate max-w-[160px]">{activeGoalTitle}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={mode === 'focus' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleSwitchMode('focus')}
              className={cn("h-8 w-8 rounded-md", mode === 'focus' && "bg-primary text-primary-foreground")}
              disabled={!isCurrentRoomWritable}
            >
              <Brain className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Focus</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={mode === 'short-break' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleSwitchMode('short-break')}
              className={cn("h-8 w-8 rounded-md", mode === 'short-break' && "bg-secondary text-secondary-foreground")}
              disabled={!isCurrentRoomWritable}
            >
              <Coffee className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Short</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={mode === 'long-break' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleSwitchMode('long-break')}
              className={cn("h-8 w-8 rounded-md", mode === 'long-break' && "bg-accent text-accent-foreground")}
              disabled={!isCurrentRoomWritable}
            >
              <Home className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Long</span>
          </div>
        </div>
        {isEditingTime ? (
          <Input
            ref={inputRef}
            type="text"
            value={editableTimeString}
            onChange={(e) => setEditableTimeString(e.target.value)}
            onBlur={handleTimeInputBlur}
            onKeyDown={handleTimeInputKeyDown}
            className="text-5xl font-bold font-mono text-center w-full h-14 bg-transparent border-none focus-visible:ring-0" // Changed text-4xl to text-5xl, h-12 to h-14
            disabled={!isCurrentRoomWritable}
          />
        ) : (
          <div
            className={cn(
              "text-5xl font-bold font-mono transition-colors", // Changed text-4xl to text-5xl
              isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
            )}
            onClick={isCurrentRoomWritable ? handleTimeDisplayClick : undefined}
          >
            {formatTime(timeLeft)}
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={handleStartPause} size="icon" className="h-12 w-12 rounded-full" disabled={!isCurrentRoomWritable}>
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={handleReset} size="icon" variant="secondary" className="h-12 w-12 rounded-full" disabled={!isCurrentRoomWritable}>
            <RotateCcw className="h-5 w-5" />
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