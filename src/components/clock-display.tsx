"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress"; // Import Progress

interface ClockDisplayProps {
  dailyProgress: number; // New prop for daily progress
}

export function ClockDisplay({ dailyProgress }: ClockDisplayProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      };

      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    };

    updateClock(); // Initial call
    const intervalId = setInterval(updateClock, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4">
      <div id="clock" className="font-semibold text-foreground">{currentTime}</div>
      <div id="date" className="text-xs">{currentDate}</div>
      <div className="w-full max-w-[100px] mt-1"> {/* Container for progress bar */}
        <Progress value={dailyProgress} className="h-1.5 [&>*]:transition-all [&>*]:duration-1000 [&>*]:ease-linear [&>*]:bg-gradient-to-r [&>*]:from-primary [&>*]:to-accent" />
      </div>
    </div>
  );
}