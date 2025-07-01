"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function CalendarPanel() {
  return (
    <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md p-4">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Calendar Panel</h2>
        <p className="text-muted-foreground">Your month-view calendar widget will be displayed here.</p>
      </CardContent>
    </Card>
  );
}