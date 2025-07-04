"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { usePomodoroSettings } from "./pomodoro/use-pomodoro-settings";
import { usePomodoroTimer } from "./pomodoro/use-pomodoro-timer";
import { usePomodoroModes } from "./pomodoro/use-pomodoro-modes";
import { usePomodoroTimeInput } from "./pomodoro/use-pomodoro-time-input";
import { formatTime, parseTimeToSeconds, PomodoroMode } from "@/lib/pomodoro-utils";

export function usePomodoroState() {
  // 1. Settings hook (provides customTimes, loading, isLoggedInMode)
  const { customTimes, setCustomTime, loadingSettings, isLoggedInMode, DEFAULT_TIMES } = usePomodoroSettings();
  
  // State for the current mode's time, initialized with focus time from settings
  const [currentModeTime, setCurrentModeTime] = useState(DEFAULT_TIMES.focus);

  // Refs to hold the latest versions of the callbacks to avoid circular dependencies
  const handleTimerEndRef = useRef<() => void>(() => {});
  const handleModeChangeRef = useRef<(newMode: PomodoroMode) => void>(() => {});
  const handleSaveParsedTimeRef = useRef<(newTimeInSeconds: number) => void>(() => {});

  // 2. Declare modular hooks, passing the refs' current values as props
  const { mode, switchMode } = usePomodoroModes({ onModeChange: (newMode) => handleModeChangeRef.current(newMode) });

  const { timeLeft, isRunning, startTimer, pauseTimer, resetTimerState, setTime } = usePomodoroTimer({
    initialTime: currentModeTime,
    onTimerEnd: () => handleTimerEndRef.current(),
  });

  const {
    isEditingTime,
    editableTimeString,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setEditableTimeString,
    setIsEditingTime,
  } = usePomodoroTimeInput({
    currentTime: timeLeft,
    onSaveTime: (newTime) => handleSaveParsedTimeRef.current(newTime),
  });

  // 3. Define the actual callbacks and update their refs
  const handleTimerEnd = useCallback(() => {
    let nextMode: PomodoroMode;
    if (mode === 'focus') {
      nextMode = 'short-break';
      toast.success("Focus session complete! Time for a break.");
    } else {
      nextMode = 'focus';
      toast.success("Break complete! Time to focus again.");
    }
    switchMode(nextMode);
  }, [mode, switchMode]); // Dependencies are now correctly ordered

  useEffect(() => {
    handleTimerEndRef.current = handleTimerEnd;
  }, [handleTimerEnd]);

  const handleModeChange = useCallback((newMode: PomodoroMode) => {
    setCurrentModeTime(customTimes[newMode]);
    setTime(customTimes[newMode]);
    pauseTimer();
    setIsEditingTime(false);
  }, [customTimes, setTime, pauseTimer, setIsEditingTime]);

  useEffect(() => {
    handleModeChangeRef.current = handleModeChange;
  }, [handleModeChange]);

  const handleSaveParsedTime = useCallback((newTimeInSeconds: number) => {
    setCustomTime(mode, newTimeInSeconds);
    setTime(newTimeInSeconds);
    toast.success("Timer time updated!");
  }, [mode, setCustomTime, setTime]);

  useEffect(() => {
    handleSaveParsedTimeRef.current = handleSaveParsedTime;
  }, [handleSaveParsedTime]);

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