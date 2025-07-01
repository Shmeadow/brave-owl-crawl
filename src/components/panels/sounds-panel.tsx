"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function SoundsPanel() {
  return (
    <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md p-4">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Sounds Panel</h2>
        <p className="text-muted-foreground">Lofi Audio Player and ambient sound controls will go here.</p>
      </CardContent>
    </Card>
  );
}