"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // Initialize as null for SSR

  useEffect(() => {
    setCurrentTime(new Date()); // Set initial time on client mount
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Render placeholder until client-side time is available
  if (!currentTime) {
    return (
      <div className="flex items-center space-x-2 h-8">
        <div className="text-base font-bold leading-none">--:--:--</div>
        <div className="text-xs text-muted-foreground leading-none">--- -- --</div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 h-8">
      <div className="text-base font-bold leading-none">
        {format(currentTime, 'HH:mm:ss')}
      </div>
      <div className="text-xs text-muted-foreground leading-none">
        {format(currentTime, 'PPP')}
      </div>
    </div>
  );
}