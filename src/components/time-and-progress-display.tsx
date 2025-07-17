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

// New hook to provide live time data
export const useClock = () => {
  const { profile, loading: authLoading } = useSupabase();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const use24HourFormat = profile?.time_format_24h ?? true;
  const timeString = formatTimeManual(time, use24HourFormat);
  const dateString = formatDateManual(time);

  return { time, timeString, dateString, isLoading: authLoading };
};

// The component itself is now just the dropdown content
export function TimeAndProgressDisplay() {
  const { time, dateString } = useClock();
  const [dailyProgress, setDailyProgress] = useState(0);
  const [gradient, setGradient] = useState('linear-gradient(to right, hsl(240 20% 15%), hsl(40 60% 70%))');

  useEffect(() => {
    const now = time;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const progress = ((now.getTime() - startOfDay.getTime()) / (endOfDay.getTime() - startOfDay.getTime())) * 100;
    setDailyProgress(progress);

    const lat = 51.5074; // Default location (London)
    const lon = -0.1278;
    const times = SunCalc.getTimes(now, lat, lon);

    const sunrise = times.sunrise.getTime();
    const sunset = times.sunset.getTime();
    const nowTime = now.getTime();

    let newGradient;
    if (nowTime < sunrise) {
      newGradient = 'linear-gradient(to right, hsl(240 20% 10%), hsl(25 30% 25%))';
    } else if (nowTime < times.solarNoon.getTime()) {
      newGradient = 'linear-gradient(to right, hsl(45 90% 55%), hsl(50 80% 70%))';
    } else if (nowTime < sunset) {
      newGradient = 'linear-gradient(to right, hsl(50 80% 70%), hsl(15 85% 55%))';
    } else {
      newGradient = 'linear-gradient(to right, hsl(15 85% 55%), hsl(240 20% 10%))';
    }
    setGradient(newGradient);
  }, [time]);

  return (
    <div className="flex flex-col items-center text-sm font-mono text-muted-foreground p-2 w-48">
      <div className="font-bold text-lg text-foreground">{dateString}</div>
      <div className="w-full mt-2 h-2 rounded-full overflow-hidden relative bg-muted">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
          style={{ width: `${dailyProgress}%`, background: gradient }}
        >
          <div className="shimmer-effect"></div>
        </div>
      </div>
      <div className="text-xs mt-1 w-full text-center">Day Progress</div>
    </div>
  );
}