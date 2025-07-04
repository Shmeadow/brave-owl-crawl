"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UsePomodoroTimerProps {
  initialTime: number;
  onTimerEnd: () => void;
}

export function usePomodoroTimer({ initialTime, onTimerEnd }: UsePomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timeLeft when initialTime changes (e.g., mode switch or settings update)
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsRunning(false); // Stop timer when it reaches 0
      onTimerEnd(); // Callback for when timer ends
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, onTimerEnd]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimerState = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTimeLeft(initialTime);
  }, [initialTime]);

  const setTime = useCallback((newTime: number) => {
    setTimeLeft(newTime);
  }, []);

  return {
    timeLeft,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimerState,
    setTime,
  };
}