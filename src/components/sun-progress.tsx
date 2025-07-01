"use client";

import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Sun } from "lucide-react";

export function SunProgress() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const totalSecondsInDay = 24 * 60 * 60;
      const secondsPassed = hours * 3600 + minutes * 60 + seconds;

      const percentage = (secondsPassed / totalSecondsInDay) * 100;
      setProgress(percentage);
    };

    updateProgress();
    const timer = setInterval(updateProgress, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-2 h-8 cursor-pointer" onClick={() => setIsVisible(!isVisible)}>
      <Sun className="h-5 w-5 text-yellow-500" />
      {isVisible && (
        <Progress value={progress} className="w-24 h-2" />
      )}
    </div>
  );
}