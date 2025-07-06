"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col items-center justify-center">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" /> Sounds & Music
          </CardTitle>
        </CardHeader>
        <CardContent className="text-foreground text-center">
          <p className="text-muted-foreground">
            Your integrated audio player is now available directly on the right side of the screen.
            Use it to play background music or other audio.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This widget can be expanded in the future to manage custom playlists or soundscapes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}