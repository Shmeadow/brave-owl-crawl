"use client";

import React, { useState, useMemo } from "react";
import { Music, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundGroup } from "@/components/ambient-sound-group";
import { Input } from "@/components/ui/input";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

const allAmbientSounds = [
  { name: "Blackbird", url: "/sound/birdblackbird.ogg", category: "Birds" },
  { name: "Crow", url: "/sound/birdcrow.ogg", category: "Birds" },
  { name: "Nightingale", url: "/sound/birdnightingale.ogg", category: "Birds" },
  { name: "Calm Fire", url: "/sound/firecalm.ogg", category: "Fire" },
  { name: "Fire Crackling", url: "/sound/firecrackling.ogg", category: "Fire" },
  { name: "Gravel Footsteps", url: "/sound/footstepsgravel.ogg", category: "Footsteps" },
  { name: "Eerie Forest", url: "/sound/foresteerie.ogg", category: "Forest" },
  { name: "Evening Forest", url: "/sound/forestevening.ogg", category: "Forest" },
  { name: "Frog Chorus", url: "/sound/frogchorus.ogg", category: "Frogs" },
  { name: "Cricket Frog", url: "/sound/frogcricket.ogg", category: "Frogs" },
  { name: "Natterjack Frog", url: "/sound/frognatterjack.ogg", category: "Frogs" },
  { name: "Wood Frog", url: "/sound/frogwood.ogg", category: "Frogs" },
  { name: "Rustling Leaves", url: "/sound/leaves.ogg", category: "Leaves" },
  { name: "Night Meadow", url: "/sound/nightmeadow.ogg", category: "Night" },
  { name: "Night Suburban", url: "/sound/nightsuburban.ogg", category: "Night" },
  { name: "Dense Rain", url: "/sound/raindense.ogg", category: "Rain" },
  { name: "Rain Dripping", url: "/sound/raindripping.ogg", category: "Rain" },
  { name: "Rain Gutter", url: "/sound/raingutter.ogg", category: "Rain" },
  { name: "Rain Porch", url: "/sound/rainporch.ogg", category: "Rain" },
  { name: "Rain Shack", url: "/sound/rainshack.ogg", category: "Rain" },
  { name: "English Restaurant", url: "/sound/restaurantenglish.ogg", category: "Cafe" },
  { name: "Calm River", url: "/sound/rivercalm.ogg", category: "River" },
  { name: "Strong River", url: "/sound/riverstrong.ogg", category: "River" },
  { name: "Thunder", url: "/sound/thunder.ogg", category: "Weather" },
  { name: "Fast Train", url: "/sound/trainfast.ogg", category: "City" },
  { name: "Slow Train", url: "/sound/trainslow.ogg", category: "City" },
  { name: "Beach Waves", url: "/sound/wavesbeach.ogg", category: "Ocean" },
  { name: "Slow Waves", url: "/sound/wavesslow.ogg", category: "Ocean" },
  { name: "Howling Wind", url: "/sound/windhowling.ogg", category: "Wind" },
  { name: "Steady Wind", url: "/sound/windsteady.ogg", category: "Wind" },
  { name: "White Noise", url: "/sound/noisewhite.ogg", category: "Noise" },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const soundGroups = useMemo(() => {
    const grouped = allAmbientSounds.reduce((acc, sound) => {
      const category = sound.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ name: sound.name, url: sound.url });
      return acc;
    }, {} as Record<string, { name: string; url: string }[]>);

    if (!searchTerm) {
      return grouped;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const filteredGroups: Record<string, { name: string; url: string }[]> = {};

    for (const category in grouped) {
      if (category.toLowerCase().includes(lowerCaseSearch) || grouped[category].some(sound => sound.name.toLowerCase().includes(lowerCaseSearch))) {
        filteredGroups[category] = grouped[category];
      }
    }
    return filteredGroups;
  }, [searchTerm]);

  const categories = Object.keys(soundGroups).sort();

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
            placeholder="Search sounds or categories..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds found.</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {categories.map((categoryName) => (
              <AmbientSoundGroup
                key={categoryName}
                categoryName={categoryName}
                sounds={soundGroups[categoryName]}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
            ))}
          </div>
        </ScrollArea>
      )}
      <p className="text-sm text-muted-foreground mt-auto p-4 text-center border-t border-border">
        Click play on any sound group to start. Multiple sounds can play simultaneously.
      </p>
    </div>
  );
}