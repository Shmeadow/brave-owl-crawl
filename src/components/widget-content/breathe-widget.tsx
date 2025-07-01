"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function BreatheWidget() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full h-full bg-card/40 backdrop-blur-xl border-white/20 flex flex-col items-center justify-center">
        <CardContent className="text-foreground text-center">
          <h2 className="text-2xl font-bold mb-2">Breathe Widget</h2>
          <p className="text-muted-foreground">A guided inhale/exhale animation will be featured here.</p>
        </CardContent>
      </Card>
    </div>
  );
}