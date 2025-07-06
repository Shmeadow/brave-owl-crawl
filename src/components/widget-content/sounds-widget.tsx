"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Categorized list of ambient sounds
const allAmbientSounds = [
  // TEMPORARY: Using an external URL for testing.
  // Please replace this with your local file path: "/sounds/beach_ocean.mp3"
  { name: "Beach Ocean", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", category: "Nature & Water" },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSounds = useMemo(() => {
    let sounds = allAmbientSounds;

    if (searchTerm) {
      sounds = sounds.filter(sound =>
        sound.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return sounds;
  }, [searchTerm]);

  return (
    <div className="h-full w-full flex flex-col p-0">
      <div className="p-4 pb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="h-6 w-6" /> Ambient Sounds
        </h2>
      </div>
      <div className="p-4 pt-2 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Removed Category Select */}
      </div>

      {filteredSounds.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds found matching your criteria.</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 grid grid-cols-1 gap-4"> {/* Changed to grid-cols-1 */}
            {filteredSounds.map((sound) => (
              <AmbientSoundItem
                key={sound.url}
                name={sound.name}
                url={sound.url}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
            ))}
          </div>
        </ScrollArea>
      )}
      <p className="text-sm text-muted-foreground mt-auto p-4 text-center border-t border-border">
        Click play on any sound to start. Multiple sounds can play simultaneously.
      </p>
    </div>
  );
}