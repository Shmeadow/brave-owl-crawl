"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function TasksWidget() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col items-center justify-center"> {/* Removed /40 */}
        <CardContent className="text-foreground text-center">
          <h2 className="text-2xl font-bold mb-2">Tasks Widget</h2>
          <p className="text-muted-foreground">Your task management system will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}