"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain, Home, ChevronDown, X, Settings, ChevronUp } from "lucide-react";
import { usePomodoroState, formatTime, parseTimeToSeconds, PomodoroMode } from "@/hooks/use-pomodoro-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PomodoroWidgetProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  onClose: () => void;
  isLoggedInMode: boolean; // New prop to check login status
  onOpenEnrollmentModal: () => void; // New prop to open enrollment modal
}

export function PomodoroWidget({ isMinimized, setIsMinimized, onClose, isLoggedInMode, onOpenEnrollmentModal }: PomodoroWidgetProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    customTimes,
    isEditingTime,
    editableTimeString,
    focusTitle,
    isSettingsOpen,
    minimizedPosition,
    setEditableTimeString,
    handleStartPause,
    handleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime,
    setFocusTitle,
    toggleSettingsOpen,
    setMinimizedPosition,
  } = usePomodoroState();

  const inputRef = useRef<HTMLInputElement>(null);
  const focusTitleInputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const [isConfirmingModeSwitch, setIsConfirmingModeSwitch] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState<PomodoroMode | null>(null);

  // State for inline time editing inputs
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editSeconds, setEditSeconds] = useState(0);

  // State for settings duration inputs
  const [pomoDuration, setPomoDuration] = useState(customTimes.focus / 60);
  const [shortBreakDuration, setShortBreakDuration] = useState(customTimes['short-break'] / 60);
  const [longBreakDuration, setLongBreakDuration] = useState(customTimes['long-break'] / 60);

  useEffect(() => {
    setPomoDuration(customTimes.focus / 60);
    setShortBreakDuration(customTimes['short-break'] / 60);
    setLongBreakDuration(customTimes['long-break'] / 60);
  }, [customTimes]);

  useEffect(() => {
    if (isEditingTime) {
      const h = Math.floor(timeLeft / 3600);
      const m = Math.floor((timeLeft % 3600) / 60);
      const s = timeLeft % 60;
      setEditHours(h);
      setEditMinutes(m);
      setEditSeconds(s);
      // Focus the first input when entering edit mode
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditingTime, timeLeft]);

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEditedTime();
    }
  };

  const handleSaveEditedTime = () => {
    const newTotalSeconds = (editHours * 3600) + (editMinutes * 60) + editSeconds;
    if (isNaN(newTotalSeconds) || newTotalSeconds <= 0 || editMinutes > 59 || editSeconds > 59) {
      toast.error("Invalid time format. Please use valid numbers for HH:MM:SS.");
      return;
    }
    setCustomTime(mode, newTotalSeconds);
    setState(prevState => ({ ...prevState, isEditingTime: false })); // Exit edit mode
    toast.success("Timer duration updated!");
  };

  const handleCancelEditedTime = () => {
    setState(prevState => ({ ...prevState, isEditingTime: false })); // Exit edit mode
    // Revert timeLeft to the current mode's custom time
    setCustomTime(mode, customTimes[mode]);
  };

  const handleSwitchModeWithConfirmation = useCallback((newMode: PomodoroMode) => {
    if (isRunning) {
      setIsConfirmingModeSwitch(true);
      setPendingModeSwitch(newMode);
    } else {
      handleSwitchMode(newMode);
    }
  }, [isRunning, handleSwitchMode]);

  const confirmModeSwitch = useCallback(() => {
    if (pendingModeSwitch) {
      handleSwitchMode(pendingModeSwitch);
      setIsConfirmingModeSwitch(false);
      setPendingModeSwitch(null);
    }
  }, [pendingModeSwitch, handleSwitchMode]);

  const cancelModeSwitch = useCallback(() => {
    setIsConfirmingModeSwitch(false);
    setPendingModeSwitch(null);
  }, []);

  const handleSaveSettings = () => {
    if (!isLoggedInMode) {
      onOpenEnrollmentModal();
      return;
    }

    if (isNaN(pomoDuration) || pomoDuration <= 0 ||
        isNaN(shortBreakDuration) || shortBreakDuration <= 0 ||
        isNaN(longBreakDuration) || longBreakDuration <= 0) {
      toast.error("Please enter valid positive numbers for all timer durations.");
      return;
    }

    setCustomTime('focus', pomoDuration * 60);
    setCustomTime('short-break', shortBreakDuration * 60);
    setCustomTime('long-break', longBreakDuration * 60);
    toast.success("Timer durations updated!");
  };

  // Draggable functionality for minimized widget
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (minimizedPosition && widgetRef.current) {
      widgetRef.current.style.left = `${minimizedPosition.x}px`;
      widgetRef.current.style.top = `${minimizedPosition.y}px`;
      widgetRef.current.style.transform = 'none'; // Remove initial centering transform
    }
  }, [minimizedPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMinimized && widgetRef.current) {
      setIsDragging(true);
      const rect = widgetRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [isMinimized]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && widgetRef.current) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      widgetRef.current.style.left = `${newX}px`;
      widgetRef.current.style.top = `${newY}px`;
      widgetRef.current.style.transform = 'none'; // Ensure transform is removed
    }
  }, [isDragging, offset]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && widgetRef.current) {
      setIsDragging(false);
      const rect = widgetRef.current.getBoundingClientRect();
      setMinimizedPosition(rect.left, rect.top);
    }
  }, [isDragging, setMinimizedPosition]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const formatMinimizedTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <>
      <div
        ref={widgetRef}
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          "bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg text-gray-100",
          isMinimized
            ? "w-fit h-fit p-2 flex items-center gap-2 cursor-pointer"
            : "w-full max-w-[250px] h-fit p-3 flex flex-col gap-1.5",
          isMinimized ? "top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" : "bottom-4 right-4" // Default position for expanded
        )}
        style={isMinimized && minimizedPosition ? { left: minimizedPosition.x, top: minimizedPosition.y, transform: 'none' } : {}}
      >
        {isMinimized ? (
          <div className="flex items-center gap-2 w-full" onClick={() => setIsMinimized(false)}>
            <div
              id="minimized-drag-area"
              className="flex-grow flex justify-center items-center cursor-grab h-full py-1"
              onMouseDown={handleMouseDown}
            >
              <span className="text-sm font-semibold select-none">{formatMinimizedTime(timeLeft)}</span>
            </div>
            <ChevronUp className="h-4 w-4 text-orange-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between w-full mb-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-300 hover:text-orange-400"
                onClick={onClose}
                title="Close Pomodoro Timer"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close Pomodoro</span>
              </Button>
              <h1 className="flex-1 text-center text-lg font-bold">Pomodoro</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-300 hover:text-orange-400"
                onClick={toggleSettingsOpen}
                title="Pomodoro Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Pomodoro Settings</span>
              </Button>
            </div>

            <div className="flex justify-center gap-0.5 mb-1.5 bg-gray-900/30 rounded-md p-0.5">
              <button
                className={cn(
                  "flex-1 py-1 px-2 rounded-sm text-xs font-medium transition-all",
                  mode === 'focus' ? "bg-orange-500 text-gray-900 shadow-sm" : "bg-transparent text-gray-300 hover:bg-gray-700/50"
                )}
                onClick={() => handleSwitchModeWithConfirmation('focus')}
              >
                Focus
              </button>
              <button
                className={cn(
                  "flex-1 py-1 px-2 rounded-sm text-xs font-medium transition-all",
                  mode === 'short-break' ? "bg-orange-500 text-gray-900 shadow-sm" : "bg-transparent text-gray-300 hover:bg-gray-700/50"
                )}
                onClick={() => handleSwitchModeWithConfirmation('short-break')}
              >
                Short Break
              </button>
              <button
                className={cn(
                  "flex-1 py-1 px-2 rounded-sm text-xs font-medium transition-all",
                  mode === 'long-break' ? "bg-orange-500 text-gray-900 shadow-sm" : "bg-transparent text-gray-300 hover:bg-gray-700/50"
                )}
                onClick={() => handleSwitchModeWithConfirmation('long-break')}
              >
                Long Break
              </button>
            </div>

            <Input
              ref={focusTitleInputRef}
              type="text"
              placeholder="click to add focus title"
              value={focusTitle}
              onChange={(e) => setFocusTitle(e.target.value)}
              className="w-full bg-gray-900/30 border border-gray-700 rounded-md px-2 py-1 text-center text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 mb-1.5"
            />

            <div className="flex flex-col items-center mb-1.5">
              {isEditingTime ? (
                <div className="flex justify-center items-center gap-0.5">
                  <Input
                    ref={inputRef}
                    type="number"
                    value={editHours.toString().padStart(2, '0')}
                    onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                    onKeyDown={handleTimeInputKeyDown}
                    className="w-11 h-8 p-0.5 border border-gray-700 rounded-sm bg-gray-800/60 text-gray-100 text-2xl font-bold text-center appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    min="0"
                    max="99"
                  />
                  <span className="text-2xl font-bold text-gray-100">:</span>
                  <Input
                    type="number"
                    value={editMinutes.toString().padStart(2, '0')}
                    onChange={(e) => setEditMinutes(parseInt(e.target.value) || 0)}
                    onKeyDown={handleTimeInputKeyDown}
                    className="w-11 h-8 p-0.5 border border-gray-700 rounded-sm bg-gray-800/60 text-gray-100 text-2xl font-bold text-center appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    min="0"
                    max="59"
                  />
                  <span className="text-2xl font-bold text-gray-100">:</span>
                  <Input
                    type="number"
                    value={editSeconds.toString().padStart(2, '0')}
                    onChange={(e) => setEditSeconds(parseInt(e.target.value) || 0)}
                    onKeyDown={handleTimeInputKeyDown}
                    className="w-11 h-8 p-0.5 border border-gray-700 rounded-sm bg-gray-800/60 text-gray-100 text-2xl font-bold text-center appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    min="0"
                    max="59"
                  />
                </div>
              ) : (
                <div
                  className="text-4xl font-bold font-mono cursor-pointer hover:text-orange-400 transition-colors"
                  onClick={handleTimeDisplayClick}
                >
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="flex justify-center gap-2 text-xs uppercase text-gray-400 mt-0.5">
                <span>HR</span>
                <span>MIN</span>
                <span>SEC</span>
              </div>
              {isEditingTime && (
                <div className="flex gap-1 mt-1.5">
                  <Button
                    className="bg-orange-500 text-gray-900 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-orange-600 transition-colors"
                    onClick={handleSaveEditedTime}
                  >
                    Save
                  </Button>
                  <Button
                    className="bg-gray-600 text-gray-100 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-700 transition-colors"
                    onClick={handleCancelEditedTime}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <button className="bg-gray-900/30 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-100 mb-1.5 hover:bg-gray-700/50 transition-colors">
              Mode: Spotlight
            </button>

            <button
              className="bg-orange-500 text-gray-900 py-2 px-4 rounded-md text-sm font-bold uppercase w-full shadow-md hover:bg-orange-600 transition-colors"
              onClick={handleStartPause}
            >
              {isRunning ? (
                <>
                  <Pause className="inline-block mr-2 h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="inline-block mr-2 h-4 w-4" /> Start Timer
                </>
              )}
            </button>
            <button
              className="bg-gray-600 text-gray-100 py-2 px-4 rounded-md text-sm font-bold uppercase w-full shadow-md hover:bg-gray-700 transition-colors mt-1"
              onClick={handleReset}
            >
              <RotateCcw className="inline-block mr-2 h-4 w-4" /> Reset
            </button>

            <div className={cn(
              "bg-gray-800/50 border border-gray-700 rounded-md mt-3 p-2 transition-all duration-300 ease-in-out overflow-hidden",
              isSettingsOpen ? "max-h-48 opacity-100 visible" : "max-h-0 opacity-0 invisible"
            )}>
              <h2 className="text-sm font-semibold mb-1 text-center">Timer Durations (Minutes)</h2>
              <div className="flex justify-center gap-1.5 flex-wrap">
                <div className="flex flex-col items-center gap-0.5">
                  <label htmlFor="pomodoro-duration" className="text-xs uppercase text-gray-400">Pomo</label>
                  <Input
                    type="number"
                    id="pomodoro-duration"
                    className="w-10 h-6 p-0.5 border border-gray-700 rounded-sm bg-gray-800/40 text-gray-100 text-sm text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={pomoDuration}
                    onChange={(e) => setPomoDuration(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <label htmlFor="short-break-duration" className="text-xs uppercase text-gray-400">Short</label>
                  <Input
                    type="number"
                    id="short-break-duration"
                    className="w-10 h-6 p-0.5 border border-gray-700 rounded-sm bg-gray-800/40 text-gray-100 text-sm text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={shortBreakDuration}
                    onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <label htmlFor="long-break-duration" className="text-xs uppercase text-gray-400">Long</label>
                  <Input
                    type="number"
                    id="long-break-duration"
                    className="w-10 h-6 p-0.5 border border-gray-700 rounded-sm bg-gray-800/40 text-gray-100 text-sm text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={longBreakDuration}
                    onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
              </div>
              <Button
                className="bg-orange-500 text-gray-900 py-1.5 px-3 rounded-md text-xs font-semibold hover:bg-orange-600 transition-colors w-full mt-2"
                onClick={handleSaveSettings}
              >
                Save Durations
              </Button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={isConfirmingModeSwitch} onOpenChange={setIsConfirmingModeSwitch}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Timer Running!</AlertDialogTitle>
            <AlertDialogDescription>
              A timer is currently running. Are you sure you want to switch modes? This will reset the current timer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelModeSwitch}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeSwitch}>Switch Mode</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Remove the old PomodoroSettingsModal as it's now integrated
// <dyad-delete path="src/components/pomodoro-settings-modal.tsx"></dyad-delete>