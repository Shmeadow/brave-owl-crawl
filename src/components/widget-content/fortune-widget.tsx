"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function FortuneWidget() {
  return (
    <Card className="bg-card/80 backdrop-blur-md p-4 h-full w-full rounded-lg flex items-center justify-center">
      <CardContent className="text-foreground text-center">
        <h2 className="text-2xl font-bold mb-2">Fortune Widget</h2>
        <p className="text-muted-foreground">A random-quote generator or fortune teller will be here.</p>
      </CardContent>
    </Card>
  );
}