"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function TimerPanel() {
  return (
    <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md p-4">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Timer Panel</h2>
        <p className="text-muted-foreground">This panel will display the Pomodoro timer and related controls.</p>
      </CardContent>
    </Card>
  );
}