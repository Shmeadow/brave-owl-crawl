"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

export function TimeTracker() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isCurrentRoomWritable } = useCurrentRoom(); // Get writability status

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

  const handleStart = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to start the time tracker in this room.");
      return;
    }
    setIsRunning(true);
    toast.success("Time tracking started!");
  };

  const handlePause = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to pause the time tracker in this room.");
      return;
    }
    setIsRunning(false);
    toast.info("Time tracking paused.");
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
    <Card className="w-full max-w-md mx-auto bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Time Tracker</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="text-6xl font-bold font-mono">
          {formatTime(time)}
        </div>
        <div className="flex gap-4">
          {!isRunning ? (
            <Button onClick={handleStart} size="lg" disabled={!isCurrentRoomWritable}>
              <Play className="mr-2 h-5 w-5" /> Start
            </Button>
          ) : (
            <Button onClick={handlePause} size="lg" variant="outline" disabled={!isCurrentRoomWritable}>
              <Pause className="mr-2 h-5 w-5" /> Pause
            </Button>
          )}
          <Button onClick={handleReset} size="lg" variant="secondary" disabled={!isCurrentRoomWritable}>
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}