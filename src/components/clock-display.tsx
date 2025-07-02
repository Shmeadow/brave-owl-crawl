"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useSupabase } from "@/integrations/supabase/auth";

interface ClockDisplayProps {
  dailyProgress: number;
}

export function ClockDisplay({ dailyProgress }: ClockDisplayProps) {
  const { profile } = useSupabase();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
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
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);

    return () => clearInterval(intervalId);
  }, [profile?.time_format_24h]);

  return (
    <div
      className="hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4"
    >
      <div className="flex items-center space-x-2">
        <div id="clock" className="text-2xl font-bold leading-none text-foreground">{currentTime}</div>
        <div id="date" className="text-sm leading-none">{currentDate}</div>
      </div>
      <div className="w-full max-w-[100px] mt-1">
        <Progress value={dailyProgress} className="h-1.5 [&>*]:transition-all [&>*]:duration-1000 [&>*]:ease-linear [&>*]:bg-gradient-to-r [&>*]:from-day-start [&>*]:to-day-end" />
      </div>
    </div>
  );
}