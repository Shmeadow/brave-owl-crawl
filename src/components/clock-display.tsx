"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils"; // Import cn

// Helper function to format time manually
const formatTimeManual = (date: Date, use24Hour: boolean) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  let ampm = '';

  if (!use24Hour) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
  }

  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${ampm ? ` ${ampm}` : ''}`;
};

// Helper function to format date manually
const formatDateManual = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options); // This is generally safe as it's less locale-dependent for basic format
};

interface ClockDisplayProps {
  className?: string; // Add className prop
}

export function ClockDisplay({ className }: ClockDisplayProps) {
  const { profile, loading: authLoading } = useSupabase();
  const [currentTimeStr, setCurrentTimeStr] = useState("--:--:--");
  const [currentDateStr, setCurrentDateStr] = useState("--- -- --");
  const [dailyProgress, setDailyProgress] = useState(0);
  const [mounted, setMounted] = useState(false); // New mounted state

  useEffect(() => {
    setMounted(true); // Component has mounted on the client
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) { // Wait for client mount and auth to load
      return;
    }

    const updateClockAndProgress = () => {
      const now = new Date();
      const use24HourFormat = profile?.time_format_24h ?? true; // Use profile setting if available, else default to 24h

      setCurrentTimeStr(formatTimeManual(now, use24HourFormat));
      setCurrentDateStr(formatDateManual(now));

      const secondsIntoDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const totalSecondsInDay = 24 * 3600;
      setDailyProgress((secondsIntoDay / totalSecondsInDay) * 100);
    };

    updateClockAndProgress(); // Initial update on client
    const intervalId = setInterval(updateClockAndProgress, 1000);

    return () => clearInterval(intervalId);
  }, [mounted, authLoading, profile?.time_format_24h]); // Re-run if profile's time format changes

  return (
    <div
      className={cn(
        "hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4",
        className // Apply className here
      )}
    >
      <div className="flex items-center space-x-2">
        <div id="clock" className="text-2xl font-bold leading-none text-foreground">{currentTimeStr}</div>
        <div id="date" className="text-sm leading-none">{currentDateStr}</div>
      </div>
      <div className="w-full mt-1">
        <Progress value={dailyProgress} className="h-1.5 [&>*]:transition-all [&>*]:duration-1000 [&>*]:ease-linear [&>*]:bg-gradient-to-r [&>*]:from-day-start [&>*]:to-day-end" />
      </div>
    </div>
  );
}