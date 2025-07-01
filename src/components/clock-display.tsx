"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    };

    updateClock(); // Initial call
    const intervalId = setInterval(updateClock, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4">
      <div id="clock" className="font-semibold text-foreground">{currentTime}</div>
      <div id="date" className="text-xs">{currentDate}</div>
    </div>
  );
}