"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

const ambientSoundCategories = [
  {
    name: "Nature",
    id: "nature",
    sounds: [
      { name: "Rain", url: "/sounds/rain.mp3" },
      { name: "Forest", url: "/sounds/forest.mp3" },
      { name: "Ocean Waves", url: "/sounds/ocean.mp3" },
    ],
  },
  {
    name: "Indoor",
    id: "indoor",
    sounds: [
      { name: "Fireplace", url: "/sounds/fireplace.mp3" },
      { name: "Cafe Ambience", url: "/sounds/cafe.mp3" },
    ],
  },
  // You can add more categories here if needed
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
          <Tabs defaultValue={ambientSoundCategories[0]?.id || "nature"} className="w-full flex flex-col flex-1">
            <TabsList className="grid w-full grid-cols-2 h-auto"> {/* Adjust grid-cols based on number of categories */}
              {ambientSoundCategories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {ambientSoundCategories.map(category => (
              <TabsContent key={category.id} value={category.id} className="mt-0 flex-1 flex flex-col">
                <ScrollArea className="flex-1 h-full">
                  <div className="p-4 space-y-3">
                    {category.sounds.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center">No sounds in this category.</p>
                    ) : (
                      category.sounds.map((sound) => (
                        <AmbientSoundItem
                          key={sound.name}
                          name={sound.name}
                          url={sound.url}
                          isCurrentRoomWritable={isCurrentRoomWritable}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
          <p className="text-sm text-muted-foreground mt-4 p-4 text-center border-t border-border">
            These sounds play independently and loop seamlessly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}