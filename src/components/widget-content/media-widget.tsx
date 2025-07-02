"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MediaWidget() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col items-center justify-center"> {/* Removed /40 */}
        <CardContent className="text-foreground text-center">
          <h2 className="text-2xl font-bold mb-2">Media Widget</h2>
          <p className="text-muted-foreground">Your image/video gallery and lightbox viewer will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}