"use client";

import React, { useState, useEffect } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import SunCalc from 'suncalc';

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
  return date.toLocaleDateString('en-US', options);
};

interface ClockDisplayProps {
  className?: string;
}

export function ClockDisplay({ className }: ClockDisplayProps) {
  const { profile, loading: authLoading } = useSupabase();
  const [currentTimeStr, setCurrentTimeStr] = useState("--:--:--");
  const [currentDateStr, setCurrentDateStr] = useState("--- -- --");
  const [dailyProgress, setDailyProgress] = useState(0);
  const [gradient, setGradient] = useState('linear-gradient(to right, hsl(240 20% 15%), hsl(40 60% 70%))'); // Cozy default
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) {
      return;
    }

    const updateClockAndProgress = () => {
      const now = new Date();
      const use24HourFormat = profile?.time_format_24h ?? true;

      setCurrentTimeStr(formatTimeManual(now, use24HourFormat));
      setCurrentDateStr(formatDateManual(now));

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const progress = ((now.getTime() - startOfDay.getTime()) / (endOfDay.getTime() - startOfDay.getTime())) * 100;
      setDailyProgress(progress);

      // Use a default location for sun calculations if none is available
      const lat = 51.5074; // London latitude
      const lon = -0.1278; // London longitude
      const times = SunCalc.getTimes(now, lat, lon);

      const sunrise = times.sunrise.getTime();
      const sunset = times.sunset.getTime();
      const nowTime = now.getTime();

      let newGradient;
      if (nowTime < sunrise) {
        // Night to sunrise (dark blue-purple to muted orange-brown)
        newGradient = 'linear-gradient(to right, hsl(240 20% 15%), hsl(30 40% 30%))';
      } else if (nowTime < times.solarNoon.getTime()) {
        // Sunrise to noon (muted green to soft yellow)
        newGradient = 'linear-gradient(to right, hsl(120 20% 50%), hsl(40 60% 70%))';
      } else if (nowTime < sunset) {
        // Noon to sunset (soft yellow to warm orange)
        newGradient = 'linear-gradient(to right, hsl(40 60% 70%), hsl(15 70% 50%))';
      } else {
        // Sunset to night (warm orange to dark blue-purple)
        newGradient = 'linear-gradient(to right, hsl(15 70% 50%), hsl(240 20% 15%))';
      }
      setGradient(newGradient);
    };

    updateClockAndProgress();
    const intervalId = setInterval(updateClockAndProgress, 1000);

    return () => clearInterval(intervalId);
  }, [mounted, authLoading, profile?.time_format_24h]);

  return (
    <div
      className={cn(
        "hidden sm:flex flex-col items-center text-sm font-mono text-muted-foreground ml-4",
        className
      )}
    >
      <div className="flex items-center space-x-2">
        <div id="clock" className="text-2xl font-bold leading-none text-foreground">{currentTimeStr}</div>
        <div id="date" className="text-sm leading-none">{currentDateStr}</div>
      </div>
      <div className="w-full mt-1 h-2 bg-muted/50 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
          style={{ width: `${dailyProgress}%`, background: gradient }}
        >
          <div className="shimmer-effect"></div>
        </div>
      </div>
    </div>
  );
}