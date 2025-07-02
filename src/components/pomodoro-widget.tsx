"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PomodoroWidgetProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

export function PomodoroWidget({ isMinimized, setIsMinimized }: PomodoroWidgetProps) {
  return isMinimized ? (
    <Card className="w-full h-full flex items-center justify-center bg-card backdrop-blur-xl border-white/20">
      <div>Minimized Version</div>
    </Card>
  ) : (
    <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col">
      <CardHeader>
        <div>Maximized Version</div>
      </CardHeader>
      <CardContent>
        <div>Content Here</div>
      </CardContent>
    </Card>
  );
}