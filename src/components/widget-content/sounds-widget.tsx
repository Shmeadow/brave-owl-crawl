"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import { AmbientSoundItem } from "@/components/ambient-sound-item"; // Import the new component
import { ScrollArea } from "@/components/ui/scroll-area";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

const ambientSounds = [
  { name: "Rain", url: "/sounds/rain.mp3" },
  { name: "Forest", url: "/sounds/forest.mp3" },
  { name: "Ocean Waves", url: "/sounds/ocean.mp3" },
  { name: "Fireplace", url: "/sounds/fireplace.mp3" },
  { name: "Cafe Ambience", url: "/sounds/cafe.mp3" },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" /> Ambient Sounds
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          {ambientSounds.length === 0 ? (
            <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds available.</p>
          ) : (
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-3">
                {ambientSounds.map((sound) => (
                  <AmbientSoundItem
                    key={sound.name}
                    name={sound.name}
                    url={sound.url}
                    isCurrentRoomWritable={isCurrentRoomWritable}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
          <p className="text-sm text-muted-foreground mt-4 p-4 text-center border-t border-border">
            These sounds play independently and loop seamlessly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}