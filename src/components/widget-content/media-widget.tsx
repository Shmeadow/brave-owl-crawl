"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MediaWidget() {
  return (
    <Card className="bg-card/80 backdrop-blur-md p-4 h-full w-full rounded-lg flex items-center justify-center">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Media Widget</h2>
        <p className="text-muted-foreground">Your image/video gallery and lightbox viewer will be displayed here.</p>
      </CardContent>
    </Card>
  );
}