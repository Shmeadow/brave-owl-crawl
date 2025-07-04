"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { usePomodoroSettings } from "./pomodoro/use-pomodoro-settings";
import { usePomodoroTimer } from "./pomodoro/use-pomodoro-timer";
import { usePomodoroModes } from "./pomodoro/use-pomodoro-modes";
import { usePomodoroTimeInput } from "./pomodoro/use-pomodoro-time-input";
import { formatTime, parseTimeToSeconds, PomodoroMode } from "@/lib/pomodoro-utils"; // Updated import path

export function usePomodoroState() {
  // 1. Settings hook (provides customTimes, loading, isLoggedInMode)
  const { customTimes, setCustomTime, loadingSettings, isLoggedInMode, DEFAULT_TIMES } = usePomodoroSettings();
  
  // State for the current mode's time, initialized with focus time from settings
  const [currentModeTime, setCurrentModeTime] = useState(DEFAULT_TIMES.focus);

  // 2. Modes hook (provides mode, switchMode)
  // This needs to be declared before handleModeChange, which it depends on.
  const { mode, switchMode } = usePomodoroModes({ onModeChange: handleModeChange });

  // 3. Timer hook (provides timeLeft, isRunning, startTimer, pauseTimer, resetTimerState, setTime)
  // This needs to be declared before handleTimerEnd and handleModeChange, which depend on its outputs.
  const { timeLeft, isRunning, startTimer, pauseTimer, resetTimerState, setTime } = usePomodoroTimer({
    initialTime: currentModeTime,
    onTimerEnd: handleTimerEnd, // handleTimerEnd is defined below, but its dependencies are resolved.
  });

  // 4. Time Input hook (provides editing state and handlers)
  // This needs to be declared before handleModeChange and handleSaveParsedTime, which depend on its outputs.
  const {
    isEditingTime,
    editableTimeString,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setEditableTimeString,
    setIsEditingTime,
  } = usePomodoroTimeInput({
    currentTime: timeLeft,
    onSaveTime: handleSaveParsedTime, // handleSaveParsedTime is defined below, but its dependencies are resolved.
  });

  // Callbacks that depend on outputs from hooks declared above
  const handleTimerEnd = useCallback(() => {
    let nextMode: PomodoroMode;
    if (mode === 'focus') {
      nextMode = 'short-break';
      toast.success("Focus session complete! Time for a break.");
    } else {
      nextMode = 'focus';
      toast.success("Break complete! Time to focus again.");
    }
    switchMode(nextMode); // This will also reset the timer via onModeChange
  }, [mode, switchMode]); // Dependencies are now correctly ordered

  const handleModeChange = useCallback((newMode: PomodoroMode) => {
    setCurrentModeTime(customTimes[newMode]);
    setTime(customTimes[newMode]); // setTime is from usePomodoroTimer
    pauseTimer(); // pauseTimer is from usePomodoroTimer
    setIsEditingTime(false); // setIsEditingTime is from usePomodoroTimeInput
  }, [customTimes, setTime, pauseTimer, setIsEditingTime]); // Dependencies are now correctly ordered

  const handleSaveParsedTime = useCallback((newTimeInSeconds: number) => {
    setCustomTime(mode, newTimeInSeconds); // setCustomTime is from usePomodoroSettings, mode is from usePomodoroModes
    setTime(newTimeInSeconds); // setTime is from usePomodoroTimer
    toast.success("Timer time updated!");
  }, [mode, setCustomTime, setTime]); // Dependencies are now correctly ordered

  // Sync currentModeTime with the active mode's time from settings
  useEffect(() => {
    setCurrentModeTime(customTimes[mode]);
    setTime(customTimes[mode]); // Ensure timer is updated when settings load or mode changes
  }, [mode, customTimes, setTime]);

  const handleStartPause = useCallback(() => {
    if (isRunning) {
      pauseTimer();
      toast.info("Timer paused.");
    } else {
      startTimer();
      toast.info("Timer started!");
    }
  }, [isRunning, pauseTimer, startTimer]);

  const handleReset = useCallback(() => {
    resetTimerState();
    toast.warning("Timer reset.");
  }, [resetTimerState]);

  return {
    mode,
    timeLeft,
    isRunning,
    customTimes,
    isEditingTime,
    editableTimeString,
    setEditableTimeString,
    handleStartPause,
    handleReset,
    handleSwitchMode: switchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime, // Expose for settings modal
    loading: loadingSettings, // Expose loading state
    isLoggedInMode, // Expose login mode
  };
}