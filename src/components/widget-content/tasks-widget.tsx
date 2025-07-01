"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function TasksWidget() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Tasks Widget</h2>
        <p className="text-muted-foreground">Your task management system will be displayed here.</p>
      </CardContent>
    </div>
  );
}