"use client";

import React from "react";
import { usePomodoroState, formatTime, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PomodoroSettingsModal } from "@/components/pomodoro-settings-modal";

interface PomodoroTimerWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function PomodoroTimerWidget({ isCurrentRoomWritable }: PomodoroTimerWidgetProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    customTimes,
    handleStartPause,
    handleReset,
    handleSwitchMode,
    setCustomTime,
  } = usePomodoroState();

  const progress = (timeLeft / (customTimes[mode] || 1)) * 100;

  const modeTextMap: Record<PomodoroMode, string> = {
    focus: "Focus",
    "short-break": "Short Break",
    "long-break": "Long Break",
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-transparent">
      <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-md border-white/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Pomodoro Timer</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!isCurrentRoomWritable}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Pomodoro Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pomodoro Settings</DialogTitle>
              </DialogHeader>
              <PomodoroSettingsModal
                initialTimes={customTimes}
                onSave={setCustomTime}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative h-48 w-48">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                className="text-muted/30"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary transition-all duration-500"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold font-mono">
                {formatTime(timeLeft).slice(3)}
              </div>
              <div className="text-sm text-muted-foreground">{modeTextMap[mode]}</div>
            </div>
          </div>

          <div className="flex gap-2">
            {(['focus', 'short-break', 'long-break'] as PomodoroMode[]).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                onClick={() => handleSwitchMode(m)}
                size="sm"
                disabled={isRunning}
              >
                {modeTextMap[m]}
              </Button>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={handleStartPause} size="lg" disabled={!isCurrentRoomWritable}>
              {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button onClick={handleReset} size="lg" variant="secondary" disabled={!isCurrentRoomWritable}>
              <RotateCcw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}