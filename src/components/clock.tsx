"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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