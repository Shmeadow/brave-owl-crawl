"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item"; // Import the new component

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Placeholder list for 31 sounds. Replace with your actual sound file names and paths.
const allAmbientSounds = [
  { name: "Rain Gutter", url: "/sounds/rain.mp3" },
  { name: "Forest Birds", url: "/sounds/forest.mp3" },
  { name: "Ocean Waves", url: "/sounds/ocean.mp3" },
  { name: "Crackling Fireplace", url: "/sounds/fireplace.mp3" },
  { name: "Busy Cafe", url: "/sounds/cafe.mp3" },
  { name: "Distant Thunder", url: "/sounds/thunder.mp3" },
  { name: "Gentle Wind", url: "/sounds/wind.mp3" },
  { name: "Flowing River", url: "/sounds/river.mp3" },
  { name: "City Ambience", url: "/sounds/city_ambience.mp3" },
  { name: "White Noise", url: "/sounds/white_noise.ogg" },
  { name: "Rain Porch", url: "/sounds/sound11.mp3" },
  { name: "Calm River", url: "/sounds/sound12.mp3" },
  { name: "Summer Night", url: "/sounds/sound13.mp3" },
  { name: "Winter Wind", url: "/sounds/sound14.mp3" },
  { name: "Distant City", url: "/sounds/sound15.mp3" },
  { name: "Gentle Rain", url: "/sounds/sound16.mp3" },
  { name: "Heavy Rain", url: "/sounds/sound17.mp3" },
  { name: "Thunderstorm", url: "/sounds/sound18.mp3" },
  { name: "Light Breeze", url: "/sounds/sound19.mp3" },
  { name: "Strong Wind", url: "/sounds/sound20.mp3" },
  { name: "Ocean Storm", url: "/sounds/sound21.mp3" },
  { name: "Forest Night", url: "/sounds/sound22.mp3" },
  { name: "Jungle Sounds", url: "/sounds/sound23.mp3" },
  { name: "Desert Wind", url: "/sounds/sound24.mp3" },
  { name: "Mountain Stream", url: "/sounds/sound25.mp3" },
  { name: "Cave Dripping", url: "/sounds/sound26.mp3" },
  { name: "Underwater Bubbles", url: "/sounds/sound27.mp3" },
  { name: "Space Ambience", url: "/sounds/sound28.mp3" },
  { name: "Zen Garden", url: "/sounds/sound29.mp3" },
  { name: "Cozy Fire", url: "/sounds/sound30.mp3" },
  { name: "Distant Train", url: "/sounds/sound31.mp3" },
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
          {allAmbientSounds.length === 0 ? (
            <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds available.</p>
          ) : (
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-3">
                {allAmbientSounds.map((sound) => (
                  <AmbientSoundItem
                    key={sound.url} // Use URL as key for uniqueness
                    name={sound.name}
                    url={sound.url}
                    isCurrentRoomWritable={isCurrentRoomWritable}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
          <p className="text-sm text-muted-foreground mt-4 p-4 text-center border-t border-border">
            Click play on any sound to start. Multiple sounds can play simultaneously.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}