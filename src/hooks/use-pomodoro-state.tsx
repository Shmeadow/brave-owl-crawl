"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes: {
    'focus': number;
    'short-break': number;
    'long-break': number;
  };
  isEditingTime: boolean;
  editableTimeString: string;
}

// Define an interface for the structure of the saved state in local storage
interface SavedPomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes?: { // customTimes might be optional if not always present in old saved states
    'focus'?: number;
    'short-break'?: number;
    'long-break'?: number;
  };
}

const DEFAULT_TIMES = {
  'focus': 25 * 60, // 25 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
};

const LOCAL_STORAGE_KEY = 'pomodoro_state';

// Helper to convert seconds to HH:MM:SS format
export const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

// Helper to convert HH:MM:SS string to seconds
export const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) { // SS format (if user just types seconds)
    return parts[0];
  }
  return 0; // Invalid format
};

export function usePomodoroState() {
  const [state, setState] = useState<PomodoroState>(() => {
    // Initialize state from local storage or defaults
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        try {
          const parsedState: SavedPomodoroState = JSON.parse(savedState);

          // Validate parsedState.mode to ensure it's one of the valid PomodoroMode values
          const validModes: PomodoroMode[] = ['focus', 'short-break', 'long-break'];
          const currentMode: PomodoroMode = validModes.includes(parsedState.mode) ? parsedState.mode : 'focus';

          // Ensure customTimes are numbers and default if missing
          const customTimes = {
            focus: parsedState.customTimes?.focus || DEFAULT_TIMES.focus,
            'short-break': parsedState.customTimes?.['short-break'] || DEFAULT_TIMES['short-break'],
            'long-break': parsedState.customTimes?.['long-break'] || DEFAULT_TIMES['long-break'],
          };
          return {
            ...parsedState,
            mode: currentMode, // Use the validated mode
            customTimes,
            // Ensure timeLeft is not negative and is within bounds of custom time for the current mode
            timeLeft: Math.max(0, Math.min(parsedState.timeLeft, customTimes[currentMode])),
            isEditingTime: false, // Always start not editing
            editableTimeString: '', // Always start empty
          };
        } catch (e) {
          console.error("Failed to parse saved pomodoro state:", e);
        }
      }
    }
    return {
      mode: 'focus',
      timeLeft: DEFAULT_TIMES.focus,
      isRunning: false,
      customTimes: DEFAULT_TIMES,
      isEditingTime: false,
      editableTimeString: '',
    };
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to save state to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const getCurrentModeTime = useCallback(() => {
    return state.customTimes[state.mode];
  }, [state.mode, state.customTimes]);

  const resetTimer = useCallback((newMode: PomodoroMode, shouldStopRunning: boolean = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState(prevState => ({
      ...prevState,
      mode: newMode,
      timeLeft: prevState.customTimes[newMode],
      isRunning: shouldStopRunning ? false : prevState.isRunning, // Only stop if explicitly told
      isEditingTime: false,
      editableTimeString: '',
    }));
  }, []);

  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setState(prevState => ({ ...prevState, timeLeft: prevState.timeLeft - 1 }));
      }, 1000);
    } else if (state.timeLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setState(prevState => {
        let nextMode: PomodoroMode;
        if (prevState.mode === 'focus') {
          nextMode = 'short-break';
          toast.success("Focus session complete! Time for a break.");
        } else {
          nextMode = 'focus';
          toast.success("Break complete! Time to focus again.");
        }
        return {
          ...prevState,
          mode: nextMode,
          timeLeft: prevState.customTimes[nextMode], // Set to default time for next mode
          isRunning: false, // Crucial: Stop running, user must manually start next session
          isEditingTime: false,
          editableTimeString: '',
        };
      });
    } else if (!state.isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.timeLeft, state.mode, state.customTimes]);

  const handleStartPause = useCallback(() => {
    setState(prevState => {
      const newIsRunning = !prevState.isRunning;
      const newTimeLeft = prevState.timeLeft === 0 ? getCurrentModeTime() : prevState.timeLeft;
      toast.info(newIsRunning ? "Timer started!" : "Timer paused.");
      return { ...prevState, isRunning: newIsRunning, timeLeft: newTimeLeft };
    });
  }, [getCurrentModeTime]);

  const handleReset = useCallback(() => {
    resetTimer(state.mode, true); // Always stop running on explicit reset
    toast.warning("Timer reset.");
  }, [state.mode, resetTimer]);

  const handleSwitchMode = useCallback((newMode: PomodoroMode) => {
    if (state.mode !== newMode) {
      setState(prevState => ({
        ...prevState,
        mode: newMode,
        timeLeft: prevState.customTimes[newMode],
        isEditingTime: false,
        editableTimeString: '',
      }));
      toast.info(`Switched to ${newMode === 'focus' ? 'Focus' : newMode === 'short-break' ? 'Short Break' : 'Long Break'} mode.`);
    }
  }, [state.mode]);

  const handleTimeDisplayClick = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isEditingTime: true,
      editableTimeString: formatTime(prevState.timeLeft),
    }));
  }, [state.timeLeft]);

  const handleTimeInputBlur = useCallback(() => {
    setState(prevState => {
      const newTime = parseTimeToSeconds(prevState.editableTimeString);
      if (!isNaN(newTime) && newTime >= 0) {
        toast.success("Timer time updated!");
        return {
          ...prevState,
          customTimes: { ...prevState.customTimes, [prevState.mode]: newTime },
          timeLeft: newTime,
          isEditingTime: false,
        };
      } else {
        toast.error("Invalid time format. Please use HH:MM:SS.");
        return {
          ...prevState,
          timeLeft: prevState.customTimes[prevState.mode], // Revert to current mode's default if invalid
          isEditingTime: false,
        };
      }
    });
  }, []);

  const setEditableTimeString = useCallback((value: string) => {
    setState(prevState => ({ ...prevState, editableTimeString: value }));
  }, []);

  // New function to update custom times from settings modal
  const setCustomTime = useCallback((mode: PomodoroMode, newTimeInSeconds: number) => {
    setState(prevState => {
      const updatedCustomTimes = {
        ...prevState.customTimes,
        [mode]: newTimeInSeconds,
      };
      // If the current mode's time is being updated, also update timeLeft
      const newTimeLeft = prevState.mode === mode ? newTimeInSeconds : prevState.timeLeft;
      return {
        ...prevState,
        customTimes: updatedCustomTimes,
        timeLeft: newTimeLeft,
      };
    });
  }, []);

  return {
    mode: state.mode,
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    customTimes: state.customTimes,
    isEditingTime: state.isEditingTime,
    editableTimeString: state.editableTimeString,
    setEditableTimeString,
    handleStartPause,
    handleReset,
    handleSwitchMode,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setCustomTime, // Expose the new function
  };
}