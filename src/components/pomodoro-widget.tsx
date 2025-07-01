"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, ChevronUp, ChevronDown, Play, Pause } from "lucide-react";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { usePomodoroState, formatTime } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";

export function PomodoroWidget() {
  const [isPoppedUp, setIsPoppedUp] = useState(false);
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
  } = usePomodoroState();

  const togglePopUp = () => {
    setIsPoppedUp(!isPoppedUp);
  };

  return (
    <>
      {isPoppedUp && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative">
            <PomodoroTimer
              mode={mode}
              timeLeft={timeLeft}
              isRunning={isRunning}
              customTimes={customTimes}
              isEditingTime={isEditingTime}
              editableTimeString={editableTimeString}
              setEditableTimeString={setEditableTimeString}
              handleStartPause={handleStartPause}
              handleReset={handleReset}
              handleSwitchMode={handleSwitchMode}
              handleTimeDisplayClick={handleTimeDisplayClick}
              handleTimeInputBlur={handleTimeInputBlur}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={togglePopUp}
            >
              <ChevronDown className="h-5 w-5" />
              <span className="sr-only">Minimize Pomodoro</span>
            </Button>
          </div>
        </div>
      )}

      {/* Docked Widget */}
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
          "transition-all duration-300 ease-in-out",
          isPoppedUp ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        )}
      >
        <Card className="p-2 flex items-center gap-3 shadow-lg border bg-background/50 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePopUp}
          >
            <Timer className="h-5 w-5" />
            <span className="sr-only">Expand Pomodoro</span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono min-w-[80px] text-center">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground capitalize">
              {mode.replace('-', ' ')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleStartPause}
          >
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            <span className="sr-only">{isRunning ? "Pause" : "Start"}</span>
          </Button>
        </Card>
      </div>
    </>
  );
}