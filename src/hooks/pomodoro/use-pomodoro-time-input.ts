"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { formatTime, parseTimeToSeconds } from "@/lib/pomodoro-utils"; // Updated import path

interface UsePomodoroTimeInputProps {
  currentTime: number;
  onSaveTime: (newTimeInSeconds: number) => void;
}

export function usePomodoroTimeInput({ currentTime, onSaveTime }: UsePomodoroTimeInputProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editableTimeString, setEditableTimeStringState] = useState('');

  const handleTimeDisplayClick = useCallback(() => {
    setIsEditingTime(true);
    setEditableTimeStringState(formatTime(currentTime));
  }, [currentTime]);

  const handleTimeInputBlur = useCallback(() => {
    const newTime = parseTimeToSeconds(editableTimeString);
    if (!isNaN(newTime) && newTime >= 0) {
      onSaveTime(newTime);
      setIsEditingTime(false);
    } else {
      toast.error("Invalid time format. Please use HH:MM:SS.");
      setIsEditingTime(false); // Exit editing mode even on error
    }
  }, [editableTimeString, onSaveTime]);

  const setEditableTimeString = useCallback((value: string) => {
    setEditableTimeStringState(value);
  }, []);

  return {
    isEditingTime,
    editableTimeString,
    handleTimeDisplayClick,
    handleTimeInputBlur,
    setEditableTimeString,
    setIsEditingTime, // Expose for external control if needed
  };
}