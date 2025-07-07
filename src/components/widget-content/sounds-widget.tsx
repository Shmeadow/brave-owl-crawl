"use client";

import React, { useState, useMemo } from "react";
import { Music, Search, Bird, Flame, Footprints, Leaf, Droplet, WavesIcon, TrainFront, Cloud, TreePine, Bug, Moon, Speaker, Wind, Coffee, Waves } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

const allAmbientSounds = [
  { name: "Blackbird", url: "/sound/birdblackbird.ogg", category: "Birds", icon: Bird },
  { name: "Crow", url: "/sound/birdcrow.ogg", category: "Birds", icon: Bird },
  { name: "Nightingale", url: "/sound/birdnightingale.ogg", category: "Birds", icon: Bird },
  { name: "Calm Fire", url: "/sound/firecalm.ogg", category: "Fire", icon: Flame },
  { name: "Fire Crackling", url: "/sound/firecrackling.ogg", category: "Fire", icon: Flame },
  { name: "Gravel Footsteps", url: "/sound/footstepsgravel.ogg", category: "Footsteps", icon: Footprints },
  { name: "Eerie Forest", url: "/sound/foresteerie.ogg", category: "Forest", icon: TreePine },
  { name: "Evening Forest", url: "/sound/forestevening.ogg", category: "Forest", icon: TreePine },
  { name: "Frog Chorus", url: "/sound/frogchorus.ogg", category: "Frogs", icon: Bug },
  { name: "Cricket Frog", url: "/sound/frogcricket.ogg", category: "Frogs", icon: Bug },
  { name: "Natterjack Frog", url: "/sound/frognatterjack.ogg", category: "Frogs", icon: Bug },
  { name: "Wood Frog", url: "/sound/frogwood.ogg", category: "Frogs", icon: Bug },
  { name: "Rustling Leaves", url: "/sound/leaves.ogg", category: "Leaves", icon: Leaf },
  { name: "Night Meadow", url: "/sound/nightmeadow.ogg", category: "Night", icon: Moon },
  { name: "Night Suburban", url: "/sound/nightsuburban.ogg", category: "Night", icon: Moon },
  { name: "Dense Rain", url: "/sound/raindense.ogg", category: "Rain", icon: Droplet },
  { name: "Rain Dripping", url: "/sound/raindripping.ogg", category: "Rain", icon: Droplet },
  { name: "Rain Gutter", url: "/sound/raingutter.ogg", category: "Rain", icon: Droplet },
  { name: "Rain Porch", url: "/sound/rainporch.ogg", category: "Rain", icon: Droplet },
  { name: "Rain Shack", url: "/sound/rainshack.ogg", category: "Rain", icon: Droplet },
  { name: "English Restaurant", url: "/sound/restaurantenglish.ogg", category: "Cafe", icon: Coffee },
  { name: "Calm River", url: "/sound/rivercalm.ogg", category: "River", icon: WavesIcon },
  { name: "Strong River", url: "/sound/riverstrong.ogg", category: "River", icon: WavesIcon },
  { name: "Thunder", url: "/sound/thunder.ogg", category: "Weather", icon: Cloud },
  { name: "Fast Train", url: "/sound/trainfast.ogg", category: "City", icon: TrainFront },
  { name: "Slow Train", url: "/sound/trainslow.ogg", category: "City", icon: TrainFront },
  { name: "Beach Waves", url: "/sound/wavesbeach.ogg", category: "Ocean", icon: Waves },
  { name: "Slow Waves", url: "/sound/wavesslow.ogg", category: "Ocean", icon: Waves },
  { name: "Howling Wind", url: "/sound/windhowling.ogg", category: "Wind", icon: Wind },
  { name: "Steady Wind", url: "/sound/windsteady.ogg", category: "Wind", icon: Wind },
  { name: "White Noise", url: "/sound/noisewhite.ogg", category: "Noise", icon: Speaker },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const soundGroups = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = allAmbientSounds.filter(sound =>
      sound.name.toLowerCase().includes(lowerCaseSearch) ||
      sound.category.toLowerCase().includes(lowerCaseSearch)
    );

    if (filtered.length === 0) {
      return {};
    }

    return filtered.reduce((acc, sound) => {
      const category = sound.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(sound);
      return acc;
    }, {} as Record<string, typeof allAmbientSounds>);
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
          <Accordion type="multiple" className="w-full p-4" defaultValue={categories}>
            {categories.map((category) => (
              <AccordionItem value={category} key={category}>
                <AccordionTrigger className="text-lg font-semibold">{category}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 pt-2">
                    {soundGroups[category].map((sound) => (
                      <AmbientSoundItem
                        key={sound.url}
                        name={sound.name}
                        url={sound.url}
                        icon={sound.icon}
                        isCurrentRoomWritable={isCurrentRoomWritable}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      )}
      <p className="text-sm text-muted-foreground mt-auto p-4 text-center border-t border-border">
        Click play on any sound to start. Multiple sounds can play simultaneously.
      </p>
    </div>
  );
}