"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useNotification } from "@/hooks/use-notification";

interface TimeTrackerProps {
  isCurrentRoomWritable: boolean;
}

export function TimeTracker({ isCurrentRoomWritable }: TimeTrackerProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((unit) => String(unit).padStart(2, "0"))
      .join(":");
  };

  const handleStartPause = () => {
    if (!isCurrentRoomWritable) {
      addNotification({ title: 'Permission Denied', message: "You do not have permission to control the time tracker in this room.", type: 'error' });
      return;
    }
    setIsRunning(!isRunning);
    addNotification({ title: 'Time Tracker', message: isRunning ? "Tracking paused." : "Tracking started!", type: 'info' });
  };

  const handleReset = () => {
    if (!isCurrentRoomWritable) {
      addNotification({ title: 'Permission Denied', message: "You do not have permission to reset the time tracker in this room.", type: 'error' });
      return;
    }
    setIsRunning(false);
    setTime(0);
    addNotification({ title: 'Time Tracker', message: "Tracking reset.", type: 'warning' });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-3">
      <div className="text-5xl font-bold font-mono text-foreground tabular-nums">
        {formatTime(time)}
      </div>
      <div className="flex gap-3">
        <Button 
          onClick={handleStartPause} 
          size="icon" 
          className="h-10 w-10 rounded-full"
          disabled={!isCurrentRoomWritable}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button 
          onClick={handleReset} 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full"
          disabled={!isCurrentRoomWritable}
          aria-label="Reset"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}