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
  focusTitle: string; // New state for focus title
  isSettingsOpen: boolean; // New state for settings section visibility
  minimizedPosition: { x: number; y: number } | null; // New state for minimized widget position
}

// Define an interface for the structure of the saved state in local storage
interface SavedPomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  customTimes?: {
    'focus'?: number;
    'short-break'?: number;
    'long-break'?: number;
  };
  focusTitle?: string;
  isSettingsOpen?: boolean;
  minimizedPosition?: { x: number; y: number };
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

          const validModes: PomodoroMode[] = ['focus', 'short-break', 'long-break'];
          const currentMode: PomodoroMode = validModes.includes(parsedState.mode) ? parsedState.mode : 'focus';

          const customTimes = {
            focus: parsedState.customTimes?.focus || DEFAULT_TIMES.focus,
            'short-break': parsedState.customTimes?.['short-break'] || DEFAULT_TIMES['short-break'],
            'long-break': parsedState.customTimes?.['long-break'] || DEFAULT_TIMES['long-break'],
          };
          return {
            ...parsedState,
            mode: currentMode,
            customTimes,
            timeLeft: Math.max(0, Math.min(parsedState.timeLeft, customTimes[currentMode])),
            isEditingTime: false,
            editableTimeString: '',
            focusTitle: parsedState.focusTitle || '',
            isSettingsOpen: parsedState.isSettingsOpen || false,
            minimizedPosition: parsedState.minimizedPosition || null,
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
      focusTitle: '',
      isSettingsOpen: false,
      minimizedPosition: null,
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
      isRunning: shouldStopRunning ? false : prevState.isRunning,
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
          timeLeft: prevState.customTimes[nextMode],
          isRunning: false,
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
    resetTimer(state.mode, true);
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
          timeLeft: prevState.customTimes[prevState.mode],
          isEditingTime: false,
        };
      }
    });
  }, []);

  const setEditableTimeString = useCallback((value: string) => {
    setState(prevState => ({ ...prevState, editableTimeString: value }));
  }, []);

  const setCustomTime = useCallback((mode: PomodoroMode, newTimeInSeconds: number) => {
    setState(prevState => {
      const updatedCustomTimes = {
        ...prevState.customTimes,
        [mode]: newTimeInSeconds,
      };
      const newTimeLeft = prevState.mode === mode ? newTimeInSeconds : prevState.timeLeft;
      return {
        ...prevState,
        customTimes: updatedCustomTimes,
        timeLeft: newTimeLeft,
      };
    });
  }, []);

  const setFocusTitle = useCallback((title: string) => {
    setState(prevState => ({ ...prevState, focusTitle: title }));
  }, []);

  const toggleSettingsOpen = useCallback(() => {
    setState(prevState => ({ ...prevState, isSettingsOpen: !prevState.isSettingsOpen }));
  }, []);

  const setMinimizedPosition = useCallback((x: number, y: number) => {
    setState(prevState => ({ ...prevState, minimizedPosition: { x, y } }));
  }, []);

  return {
    mode: state.mode,
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    customTimes: state.customTimes,
    isEditingTime: state.isEditingTime,
    editableTimeString: state.editableTimeString,
    focusTitle: state.focusTitle,
    isSettingsOpen: state.isSettingsOpen,
    minimizedPosition: state.minimizedPosition,
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
  };
}