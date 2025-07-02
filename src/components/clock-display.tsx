"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress"; // Import Progress
import { useSupabase } from "@/integrations/supabase/auth"; // Import useSupabase

interface ClockDisplayProps {
  dailyProgress: number; // New prop for daily progress
}

export function ClockDisplay({ dailyProgress }: ClockDisplayProps) {
  const { profile } = useSupabase(); // Get profile from Supabase context
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isProgressVisible, setIsProgressVisible] = useState(false); // State for progress bar visibility

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit', // Added seconds
        hour12: !(profile?.time_format_24h ?? true), // Use profile setting, default to 24h (true)
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
  }, [profile?.time_format_24h]); // Re-run effect if time format preference changes

  return (
    <div 
      className="hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4 cursor-pointer"
      onClick={() => setIsProgressVisible(!isProgressVisible)} // Toggle visibility on click
    >
      <div className="flex items-center space-x-2"> {/* Horizontal layout for time and date */}
        <div id="clock" className="text-base font-bold leading-none text-foreground">{currentTime}</div>
        <div id="date" className="text-xs leading-none">{currentDate}</div>
      </div>
      {isProgressVisible && ( // Conditionally render progress bar
        <div className="w-full max-w-[100px] mt-1"> {/* Container for progress bar */}
          <Progress value={dailyProgress} className="h-1.5 [&>*]:transition-all [&>*]:duration-1000 [&>*]:ease-linear [&>*]:bg-gradient-to-r [&>*]:from-day-start [&>*]:to-day-end" />
        </div>
      )}
    </div>
  );
}