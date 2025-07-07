"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TimeTrackerProps {
  isCurrentRoomWritable: boolean;
}

export function TimeTracker({ isCurrentRoomWritable }: TimeTrackerProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      toast.error("You do not have permission to control the time tracker in this room.");
      return;
    }
    setIsRunning(!isRunning);
    toast.info(isRunning ? "Time tracking paused." : "Time tracking started!");
  };

  const handleReset = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to reset the time tracker in this room.");
      return;
    }
    setIsRunning(false);
    setTime(0);
    toast.warning("Time tracking reset.");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4">
      <div className="text-6xl font-bold font-mono text-foreground tabular-nums">
        {formatTime(time)}
      </div>
      <div className="flex gap-4">
        <Button 
          onClick={handleStartPause} 
          size="icon" 
          className="h-12 w-12 rounded-full"
          disabled={!isCurrentRoomWritable}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <Button 
          onClick={handleReset} 
          size="icon" 
          variant="secondary" 
          className="h-12 w-12 rounded-full"
          disabled={!isCurrentRoomWritable}
          aria-label="Reset"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}