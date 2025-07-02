"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useSupabase } from "@/integrations/supabase/auth";

export function ClockDisplay() {
  const { profile } = useSupabase();
  // Initialize with static values to prevent hydration mismatch
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const [currentDate, setCurrentDate] = useState("--- -- --");
  const [dailyProgress, setDailyProgress] = useState(0); // Moved here

  useEffect(() => {
    const updateClockAndProgress = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !(profile?.time_format_24h ?? true),
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      };

      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));

      // Calculate daily progress
      const secondsIntoDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const totalSecondsInDay = 24 * 3600;
      setDailyProgress((secondsIntoDay / totalSecondsInDay) * 100);
    };

    // Run once on mount, then set interval
    updateClockAndProgress();
    const intervalId = setInterval(updateClockAndProgress, 1000);

    return () => clearInterval(intervalId);
  }, [profile?.time_format_24h]); // Depend on profile?.time_format_24h to re-run if it changes

  return (
    <div
      className="hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4"
    >
      <div className="flex items-center space-x-2">
        <div id="clock" className="text-2xl font-bold leading-none text-foreground">{currentTime}</div>
        <div id="date" className="text-sm leading-none">{currentDate}</div>
      </div>
      {/* Removed max-w-[100px] to allow it to match the width of the clock/date line */}
      <div className="w-full mt-1">
        <Progress value={dailyProgress} className="h-1.5 [&>*]:transition-all [&>*]:duration-1000 [&>*]:ease-linear [&>*]:bg-gradient-to-r [&>*]:from-day-start [&>*]:to-day-end" />
      </div>
    </div>
  );
}