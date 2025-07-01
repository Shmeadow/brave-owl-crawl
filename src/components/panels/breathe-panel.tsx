"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function BreathePanel() {
  return (
    <Card className="bg-card/80 backdrop-blur-md p-4 h-full w-full rounded-lg flex items-center justify-center">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Breathe Panel</h2>
        <p className="text-muted-foreground">A guided inhale/exhale animation will be featured here.</p>
      </CardContent>
    </Card>
  );
}