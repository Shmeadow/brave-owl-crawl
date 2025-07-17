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
import { useCurrentRoom }
 from "@/hooks/use-current-room";
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
          "shadow-lg flex flex-col transition-all duration-300 ease-in-out mx-auto", // Added mx-auto for horizontal centering
          "bg-card/60 backdrop-blur-lg border-white/20", // Consistent transparency
          isMobileExpanded ? "h-auto p-1 rounded-xl w-full max-w-[200px]" : "h-24 p-1 items-center justify-center flex-col rounded-full w-24" // Adjusted height to h-24 and width to w-24 for minimized, changed justify-between to justify-center
        )}
      >
        {isMobileExpanded ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between w-full px-3 pb-2">
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
            <CardContent className="flex flex-col items-center gap-2 w-full p-0.5"> {/* Reduced gap and padding */}
              {isFocusSessionActive && activeGoalTitle && mode === 'focus' && (
                <div className="text-center mb-1">
                  <p className="text-xs text-muted-foreground">Focusing on:</p>
                  <p className="text-sm font-semibold text-primary truncate max-w-[200px]">{activeGoalTitle}</p>
                </div>
              )}
              <div className="flex gap-2 justify-center w-full">
                <Button
                  variant={mode === 'focus' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleSwitchMode('focus')}
                  className={cn("h-6 w-6 rounded-md", mode === 'focus' ? "bg-primary text-primary-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Brain className="h-3 w-3" />
                </Button>
                <Button
                  variant={mode === 'short-break' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleSwitchMode('short-break')}
                  className={cn("h-6 w-6 rounded-md", mode === 'short-break' ? "bg-secondary text-secondary-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Coffee className="h-3 w-3" />
                </Button>
                <Button
                  variant={mode === 'long-break' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleSwitchMode('long-break')}
                  className={cn("h-6 w-6 rounded-md", mode === 'long-break' ? "bg-accent text-accent-foreground" : "")}
                  disabled={!isCurrentRoomWritable}
                >
                  <Home className="h-3 w-3" />
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
              <div className="flex gap-2 mt-2"> {/* Added mt-2 to push buttons below timer */}
                <Button onClick={handleStartPause} size="icon" className="h-7 w-7 rounded-full" disabled={!isCurrentRoomWritable}> {/* Smaller buttons */}
                  {isRunning ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={handleReset} size="icon" variant="secondary" className="h-7 w-7 rounded-full" disabled={!isCurrentRoomWritable}> {/* Smaller buttons */}
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          // Minimized mobile view (vertical)
          <div className="flex flex-col items-center justify-center gap-0.5"> {/* New wrapper div, changed gap */}
            <span className="text-base font-semibold capitalize">{mode.replace('-', ' ')}</span> {/* Removed mt-1 */}
            <div
              className={cn(
                "text-lg font-bold font-mono", // Removed my-1
                isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
              )}
              onClick={toggleMobileExpand}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="flex flex-row gap-1">
              <Button onClick={(e) => { e.stopPropagation(); handleStartPause(); }} size="icon" className="h-5 w-5" disabled={!isCurrentRoomWritable}>
                {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); handleReset(); }} size="icon" variant="secondary" className="h-5 w-5" disabled={!isCurrentRoomWritable}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2",
        "flex transition-all duration-300 ease-in-out z-[901]",
        // Styles for normal (expanded) state
        !isMinimized && "w-52 flex-col items-center p-3 gap-3 h-auto bg-card/60 backdrop-blur-lg border-white/20 shadow-lg rounded-3xl",
        // Styles for minimized (docked) state
        isMinimized && "w-48 flex-col items-center px-2 py-1 h-auto cursor-pointer bg-card/60 backdrop-blur-lg border-white/20 shadow-lg rounded-full"
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between w-full px-3 pb-2",
        isMinimized ? "hidden" : ""
      )}>
        <CardTitle className="text-lg font-bold text-left">
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

      <CardContent className={cn("flex flex-col items-center gap-3 w-full p-0", isMinimized ? "hidden" : "flex")}>
        {isFocusSessionActive && activeGoalTitle && mode === 'focus' && (
          <div className="text-center mb-2">
            <p className="text-xs text-muted-foreground">Focusing on:</p>
            <p className="text-sm font-semibold text-primary truncate max-w-[160px]">{activeGoalTitle}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-1 w-full">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={mode === 'focus' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleSwitchMode('focus')}
              className={cn("h-5 w-5 rounded-md", mode === 'focus' && "bg-primary text-primary-foreground")}
              disabled={!isCurrentRoomWritable}
            >
              <Brain className="h-2.5 w-2.5" />
            </Button>
            {/* Removed text label for desktop mode buttons */}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={mode === 'short-break' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleSwitchMode('short-break')}
              className={cn("h-5 w-5 rounded-md", mode === 'short-break' && "bg-secondary text-secondary-foreground")}
              disabled={!isCurrentRoomWritable}
            >
              <Coffee className="h-2.5 w-2.5" />
            </Button>
            {/* Removed text label for desktop mode buttons */}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={mode === 'long-break' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleSwitchMode('long-break')}
              className={cn("h-5 w-5 rounded-md", mode === 'long-break' && "bg-accent text-accent-foreground")}
              disabled={!isCurrentRoomWritable}
            >
              <Home className="h-2.5 w-2.5" />
            </Button>
            {/* Removed text label for desktop mode buttons */}
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
            className="text-4xl font-bold font-mono text-center w-full h-10 bg-transparent border-none focus-visible:ring-0"
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
        <div className="flex gap-3 justify-center">
          <Button onClick={handleStartPause} size="icon" className="h-7 w-7 rounded-full" disabled={!isCurrentRoomWritable}>
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={handleReset} size="icon" variant="secondary" className="h-7 w-7 rounded-full" disabled={!isCurrentRoomWritable}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {isMinimized && (
        <div className="flex flex-col items-center justify-center w-full h-full py-2">
          <span className="text-lg font-semibold capitalize">{mode.replace('-', ' ')}</span>
          <div
            className={cn(
              "text-2xl font-bold font-mono my-1",
              isCurrentRoomWritable ? "cursor-pointer hover:text-primary" : "cursor-not-allowed opacity-70"
            )}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-1">
            <Button onClick={(e) => { e.stopPropagation(); handleStartPause(); }} size="icon" className="h-8 w-8" disabled={!isCurrentRoomWritable}>
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); handleReset(); }} size="icon" variant="secondary" className="h-8 w-8" disabled={!isCurrentRoomWritable}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}