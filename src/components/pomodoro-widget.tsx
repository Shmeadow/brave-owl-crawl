"use client";
import React, { useEffect, useRef } from "react";
// ... other imports ...

interface PomodoroWidgetProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

export function PomodoroWidget({ isMinimized, setIsMinimized }: PomodoroWidgetProps) {
  // ... existing implementation ...
  return (
    // ... existing JSX ...
  );
}

// No default export at the bottom